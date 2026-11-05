import { randomUUID } from "node:crypto";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  created,
  badRequest,
  notFound,
  serverError,
  getUserId,
  getName,
  parseBody,
  type ApiEvent,
} from "../../shared/http.js";
import { moderateText } from "../../shared/moderation.js";
import { directConversationId } from "../../shared/dm.js";
import { sendToUsers } from "../../shared/broadcast.js";
import { notify } from "../../shared/notifications.js";

const PROFILES_TABLE = process.env.PROFILES_TABLE!;
const CONVERSATIONS_TABLE = process.env.CONVERSATIONS_TABLE!;
const MEMBERS_TABLE = process.env.CONVERSATION_MEMBERS_TABLE!;
const MESSAGES_TABLE = process.env.MESSAGES_TABLE!;

interface SendInput {
  to?: string; // recipient userId (1:1)
  content?: string;
}

/**
 * POST /messages — send a direct message to another user.
 * Body { to, content }. Resolves (or creates) the 1:1 conversation for the
 * sender + recipient, stores the message, upserts both members' metadata, then
 * pushes the message live to both participants and notifies the recipient.
 * SECURITY: the sender is always the verified JWT sub, never the body.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const senderId = getUserId(event);
    const body = parseBody<SendInput>(event);
    const to = body.to?.trim();
    const content = body.content?.trim();

    if (!to) return badRequest("to is required");
    if (to === senderId) return badRequest("You can't message yourself");
    if (!content) return badRequest("content is required");

    const mod = moderateText(content);
    if (!mod.allowed) return badRequest(mod.reason!);

    // Recipient must exist and be an active account.
    const recipient = await ddb.send(
      new GetCommand({ TableName: PROFILES_TABLE, Key: { userId: to } })
    );
    if (
      !recipient.Item ||
      recipient.Item.status === "deactivated" ||
      recipient.Item.status === "pending_deletion"
    ) {
      return notFound("Recipient not found");
    }

    const conversationId = directConversationId(senderId, to);
    const now = new Date().toISOString();
    const senderName = getName(event) ?? "";

    const message = {
      conversationId,
      messageId: `${now}#${randomUUID()}`,
      senderId,
      senderName,
      content,
      createdAt: now,
    };
    await ddb.send(new PutCommand({ TableName: MESSAGES_TABLE, Item: message }));

    // Conversation metadata (denormalized last message for the list view).
    await ddb.send(
      new PutCommand({
        TableName: CONVERSATIONS_TABLE,
        Item: {
          conversationId,
          participants: [senderId, to],
          lastMessage: content.slice(0, 200),
          lastSenderId: senderId,
          lastMessageAt: now,
        },
      })
    );

    // One member row per participant. The sender has implicitly read up to now.
    await Promise.all([
      ddb.send(
        new PutCommand({
          TableName: MEMBERS_TABLE,
          Item: {
            userId: senderId,
            conversationId,
            otherUserId: to,
            lastMessageAt: now,
            lastReadAt: now,
          },
        })
      ),
      ddb.send(
        new PutCommand({
          TableName: MEMBERS_TABLE,
          Item: {
            userId: to,
            conversationId,
            otherUserId: senderId,
            lastMessageAt: now,
            // preserve the recipient's existing lastReadAt if present
            ...(await readReceipt(to, conversationId)),
          },
        })
      ),
    ]);

    // Live delivery to both participants' open sockets.
    await sendToUsers([senderId, to], { type: "message.created", item: message });

    // In-app notification for the recipient (fire-and-forget, no self-notify).
    await notify({
      recipientId: to,
      actorId: senderId,
      actorName: senderName,
      type: "message.new",
      message: `${senderName || "Someone"} sent you a message`,
      link: "/chat",
    });

    return created(message);
  } catch (err) {
    console.error("sendMessage error", err);
    return serverError();
  }
};

/** Keep the recipient's existing lastReadAt so a new message marks it unread. */
async function readReceipt(userId: string, conversationId: string) {
  const existing = await ddb.send(
    new GetCommand({ TableName: MEMBERS_TABLE, Key: { userId, conversationId } })
  );
  return existing.Item?.lastReadAt
    ? { lastReadAt: existing.Item.lastReadAt }
    : {};
}
