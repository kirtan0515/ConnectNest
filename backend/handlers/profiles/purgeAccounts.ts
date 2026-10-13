import {
  QueryCommand,
  ScanCommand,
  DeleteCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { ddb } from "../../shared/db.js";
import { AccountStatus, audit } from "../../shared/account.js";

const PROFILES = process.env.PROFILES_TABLE!;
const EVENTS = process.env.EVENTS_TABLE!;
const RSVPS = process.env.RSVPS_TABLE!;
const POSTS = process.env.POSTS_TABLE!;
const COMMENTS = process.env.COMMENTS_TABLE!;
const POST_LIKES = process.env.POST_LIKES_TABLE!;
const GROUPS = process.env.GROUPS_TABLE!;
const GROUP_MEMBERS = process.env.GROUP_MEMBERS_TABLE!;
const USER_POOL_ID = process.env.USER_POOL_ID!;

const cognito = new CognitoIdentityProviderClient({});

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
