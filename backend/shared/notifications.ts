import { randomUUID } from "node:crypto";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "./db.js";
import { broadcast } from "./broadcast.js";

const TABLE = process.env.NOTIFICATIONS_TABLE;

export type NotificationType =
  | "event.rsvp"
  | "post.comment"
  | "post.like"
  | "group.join"
  | "message.new";

export interface NotifyInput {
  /** Who receives the notification (the entity owner). */
  recipientId: string;
  /** Who triggered it (the acting user). */
  actorId: string;
  actorName?: string;
  type: NotificationType;
  /** Short human-readable summary, e.g. "Bob commented on your post". */
  message: string;
  /** Deep-link target the UI can route to, e.g. "/events/<id>". */
  link?: string;
}

/** Notifications older than this are dropped by DynamoDB TTL (90 days). */
const TTL_SECONDS = 90 * 24 * 60 * 60;

/**
 * Create a notification for the recipient and push a live "notification.created"
 * event over WebSocket. Fire-and-forget: NEVER throws, so the originating write
 * (RSVP, comment, like, join) is never blocked or failed by notification work.
 * A user acting on their own content is not notified.
 */
export async function notify(input: NotifyInput): Promise<void> {
  if (!TABLE) return;
  if (input.recipientId === input.actorId) return; // no self-notifications
  try {
    const now = new Date();
    const item = {
      userId: input.recipientId,
      notificationId: `${now.toISOString()}#${randomUUID()}`,
      type: input.type,
      actorId: input.actorId,
      actorName: input.actorName ?? "",
      message: input.message,
      link: input.link ?? "",
      read: false,
      createdAt: now.toISOString(),
      ttl: Math.floor(now.getTime() / 1000) + TTL_SECONDS,
    };
    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
    // Clients filter by recipient; broadcast is best-effort fan-out.
    await broadcast({ type: "notification.created", item });
  } catch (err) {
    console.error("notify error", err);
  }
}
