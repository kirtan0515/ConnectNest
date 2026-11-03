import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { ok, serverError, getUserId, type ApiEvent } from "../../shared/http.js";

const TABLE = process.env.NOTIFICATIONS_TABLE!;

/**
 * GET /me/notifications — the current user's notifications, newest first.
 * Returns the list plus an `unreadCount` the UI uses for the badge.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
        ScanIndexForward: false, // notificationId starts with ISO ts -> newest first
        Limit: 50,
      })
    );
    const items = res.Items ?? [];
    const unreadCount = items.filter((n) => !n.read).length;
    return ok({ items, unreadCount });
  } catch (err) {
    console.error("listNotifications error", err);
    return serverError();
  }
};
