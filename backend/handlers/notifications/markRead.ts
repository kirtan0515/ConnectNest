import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  serverError,
  getUserId,
  parseBody,
  type ApiEvent,
} from "../../shared/http.js";

const TABLE = process.env.NOTIFICATIONS_TABLE!;

interface MarkInput {
  /** Specific ids to mark read. When omitted, all of the user's are marked. */
  notificationIds?: string[];
}

/**
 * POST /me/notifications/read — mark notifications read for the current user.
 * Body { notificationIds?: string[] }. With no ids, marks everything read.
 * The partition key is the user id, so a user can only ever touch their own.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const body = parseBody<MarkInput>(event);

    let ids = body.notificationIds;
    if (!ids || ids.length === 0) {
      const res = await ddb.send(
        new QueryCommand({
          TableName: TABLE,
          KeyConditionExpression: "userId = :u",
          FilterExpression: "#r = :f",
          ExpressionAttributeNames: { "#r": "read" },
          ExpressionAttributeValues: { ":u": userId, ":f": false },
          ProjectionExpression: "notificationId",
        })
      );
      ids = (res.Items ?? []).map((n) => String(n.notificationId));
    }

    await Promise.all(
      ids.map((notificationId) =>
        ddb.send(
          new UpdateCommand({
            TableName: TABLE,
            Key: { userId, notificationId },
            UpdateExpression: "SET #r = :t",
            ExpressionAttributeNames: { "#r": "read" },
            ExpressionAttributeValues: { ":t": true },
          })
        )
      )
    );
    return ok({ updated: ids.length });
  } catch (err) {
    console.error("markRead error", err);
    return serverError();
  }
};
