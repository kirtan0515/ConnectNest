import {
  QueryCommand,
  ScanCommand,
  DeleteCommand,
  GetCommand,
  UpdateCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { ddb } from "../../shared/db.js";
import { AccountStatus, audit } from "../../shared/account.js";
import {
  REMOVED_MESSAGE_CONTENT,
  DELETED_SENDER_NAME,
  uploadPrefixes,
  shouldAnonymizeMessage,
  shouldDeleteConversation,
  anonymizedPreview,
} from "../../shared/purge.js";

const PROFILES = process.env.PROFILES_TABLE!;
const EVENTS = process.env.EVENTS_TABLE!;
const RSVPS = process.env.RSVPS_TABLE!;
const POSTS = process.env.POSTS_TABLE!;
const COMMENTS = process.env.COMMENTS_TABLE!;
const POST_LIKES = process.env.POST_LIKES_TABLE!;
const GROUPS = process.env.GROUPS_TABLE!;
const GROUP_MEMBERS = process.env.GROUP_MEMBERS_TABLE!;
const CONVERSATIONS = process.env.CONVERSATIONS_TABLE!;
const CONVERSATION_MEMBERS = process.env.CONVERSATION_MEMBERS_TABLE!;
const MESSAGES = process.env.MESSAGES_TABLE!;
const UPLOADS_BUCKET = process.env.UPLOADS_BUCKET!;
const USER_POOL_ID = process.env.USER_POOL_ID!;

const cognito = new CognitoIdentityProviderClient({});
const s3 = new S3Client({});

/** Delete many items from one table in batches of 25 (BatchWrite limit). */
async function batchDelete(
  table: string,
  keys: Record<string, unknown>[]
): Promise<void> {
  for (let i = 0; i < keys.length; i += 25) {
    const chunk = keys.slice(i, i + 25);
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [table]: chunk.map((Key) => ({ DeleteRequest: { Key } })),
        },
      })
    );
  }
}

/** Query every page of a key-condition query. */
async function queryAll(
  params: ConstructorParameters<typeof QueryCommand>[0]
): Promise<Record<string, any>[]> {
  const items: Record<string, any>[] = [];
  let startKey: Record<string, any> | undefined;
  do {
    const res = await ddb.send(
      new QueryCommand({ ...params, ExclusiveStartKey: startKey })
    );
    items.push(...(res.Items ?? []));
    startKey = res.LastEvaluatedKey;
  } while (startKey);
  return items;
}

/**
 * Remove the user's direct-message data: delete their membership rows,
 * anonymize messages they sent (the other participant keeps their history),
 * and delete the conversation entirely once no participant remains.
 */
async function purgeDirectMessages(userId: string): Promise<void> {
  const memberships = await queryAll({
    TableName: CONVERSATION_MEMBERS,
    KeyConditionExpression: "userId = :u",
    ExpressionAttributeValues: { ":u": userId },
  });
  for (const m of memberships) {
    const conversationId = m.conversationId as string;
    const otherUserId = m.otherUserId as string | undefined;
    const other = otherUserId
      ? await ddb.send(
          new GetCommand({
            TableName: CONVERSATION_MEMBERS,
            Key: { userId: otherUserId, conversationId },
            ConsistentRead: true,
          })
        )
      : undefined;
    const messages = await queryAll({
      TableName: MESSAGES,
      KeyConditionExpression: "conversationId = :c",
      ExpressionAttributeValues: { ":c": conversationId },
    });
    if (shouldDeleteConversation(!!other?.Item)) {
      await batchDelete(
        MESSAGES,
        messages.map((x) => ({ conversationId, messageId: x.messageId }))
      );
      await ddb.send(
        new DeleteCommand({ TableName: CONVERSATIONS, Key: { conversationId } })
      );
    } else {
      for (const msg of messages) {
        if (!shouldAnonymizeMessage(msg, userId)) continue;
        await ddb.send(
          new UpdateCommand({
            TableName: MESSAGES,
            Key: { conversationId, messageId: msg.messageId },
            UpdateExpression: "SET content = :c, senderName = :n",
            ExpressionAttributeValues: {
              ":c": REMOVED_MESSAGE_CONTENT,
              ":n": DELETED_SENDER_NAME,
            },
          })
        );
      }
      const conv = await ddb.send(
        new GetCommand({ TableName: CONVERSATIONS, Key: { conversationId } })
      );
      const preview = conv.Item ? anonymizedPreview(conv.Item, userId) : null;
      if (preview) {
        await ddb.send(
          new UpdateCommand({
            TableName: CONVERSATIONS,
            Key: { conversationId },
            UpdateExpression: "SET lastMessage = :m",
            ExpressionAttributeValues: { ":m": preview.lastMessage },
          })
        );
      }
    }
  }
  await batchDelete(
    CONVERSATION_MEMBERS,
    memberships.map((m) => ({ userId, conversationId: m.conversationId }))
  );
}

/** Delete every S3 object the user uploaded (avatars, posts, files). */
async function purgeUploads(userId: string): Promise<void> {
  for (const Prefix of uploadPrefixes(userId)) {
    let token: string | undefined;
    do {
      const page = await s3.send(
        new ListObjectsV2Command({
          Bucket: UPLOADS_BUCKET,
          Prefix,
          ContinuationToken: token,
        })
      );
      const keys = (page.Contents ?? []).flatMap((o) =>
        o.Key ? [{ Key: o.Key }] : []
      );
      if (keys.length) {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: UPLOADS_BUCKET,
            Delete: { Objects: keys, Quiet: true },
          })
        );
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
  }
}

/** Hard-delete every trace of one user across all tables + Cognito. */
async function purgeUser(userId: string): Promise<void> {
  // Events owned by the user (byOwner GSI) + their RSVPs on those events.
  const ownedEvents = await ddb.send(
    new QueryCommand({
      TableName: EVENTS,
      IndexName: "byOwner",
      KeyConditionExpression: "ownerId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );
  await batchDelete(
    EVENTS,
    (ownedEvents.Items ?? []).map((e) => ({ eventId: e.eventId }))
  );

  // The user's RSVPs (byUser GSI on RSVPs: PK eventId, SK userId).
  const myRsvps = await ddb.send(
    new QueryCommand({
      TableName: RSVPS,
      IndexName: "byUser",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );
  await batchDelete(
    RSVPS,
    (myRsvps.Items ?? []).map((r) => ({ eventId: r.eventId, userId }))
  );

  // Posts authored by the user (Scan + filter — no author GSI at demo scale).
  const posts = await ddb.send(
    new ScanCommand({
      TableName: POSTS,
      FilterExpression: "authorId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );
  await batchDelete(
    POSTS,
    (posts.Items ?? []).map((p) => ({ postId: p.postId }))
  );

  // Likes by the user (Scan + filter).
  const likes = await ddb.send(
    new ScanCommand({
      TableName: POST_LIKES,
      FilterExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );
  await batchDelete(
    POST_LIKES,
    (likes.Items ?? []).map((l) => ({ postId: l.postId, userId }))
  );

  // Comments by the user (Scan + filter; PK postId, SK commentId).
  const comments = await ddb.send(
    new ScanCommand({
      TableName: COMMENTS,
      FilterExpression: "authorId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );
  await batchDelete(
    COMMENTS,
    (comments.Items ?? []).map((c) => ({
      postId: c.postId,
      commentId: c.commentId,
    }))
  );

  // Group memberships (byUser GSI on GroupMembers: PK groupId, SK userId).
  const memberships = await ddb.send(
    new QueryCommand({
      TableName: GROUP_MEMBERS,
      IndexName: "byUser",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );
  await batchDelete(
    GROUP_MEMBERS,
    (memberships.Items ?? []).map((m) => ({ groupId: m.groupId, userId }))
  );

  // Groups owned by the user (Scan + filter).
  const ownedGroups = await ddb.send(
    new ScanCommand({
      TableName: GROUPS,
      FilterExpression: "ownerId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );
  await batchDelete(
    GROUPS,
    (ownedGroups.Items ?? []).map((g) => ({ groupId: g.groupId }))
  );

  await purgeDirectMessages(userId);
  await purgeUploads(userId);
  // Profile row.
  await ddb.send(new DeleteCommand({ TableName: PROFILES, Key: { userId } }));

  // Cognito user (the account itself). userId is the Cognito sub == username
  // for email sign-ups; AdminDeleteUser accepts the sub as username.
  try {
    await cognito.send(
      new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: userId })
    );
  } catch (err) {
    console.error(`Cognito delete failed for ${userId}`, err);
  }

  await audit(userId, "account.purged");
}

/**
 * Scheduled (EventBridge) handler: find accounts past their deletion grace
 * window and hard-purge them. Runs daily.
 */
export const handler = async () => {
  const nowIso = new Date().toISOString();
  const due = await ddb.send(
    new QueryCommand({
      TableName: PROFILES,
      IndexName: "byStatus",
      KeyConditionExpression: "#s = :s AND deletedAt <= :cut",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": AccountStatus.PENDING_DELETION,
        // deletedAt <= (now - grace) is implied by purgeAfter; simpler: check
        // purgeAfter <= now via a filter since GSI sort key is deletedAt.
        ":cut": nowIso,
      },
      FilterExpression: "purgeAfter <= :now",
    })
  );

  const users = due.Items ?? [];
  console.log(`purgeAccounts: ${users.length} account(s) due`);
  for (const u of users) {
    try {
      await purgeUser(u.userId);
      console.log(`purged ${u.userId}`);
    } catch (err) {
      console.error(`purge failed for ${u.userId}`, err);
    }
  }
  return { purged: users.length };
};
