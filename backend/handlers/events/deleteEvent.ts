import { GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  noContent,
  badRequest,
  forbidden,
  notFound,
  serverError,
  getUserId,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";

const TABLE = process.env.EVENTS_TABLE!;

/**
 * DELETE /events/{eventId} — owner-only delete.
 * SECURITY: verifies ownerId === JWT sub before deleting.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const eventId = pathParam(event, "eventId");
    if (!eventId) return badRequest("Missing eventId");

    const existing = await ddb.send(
      new GetCommand({ TableName: TABLE, Key: { eventId } })
    );
    if (!existing.Item) return notFound("Event not found");
    if (existing.Item.ownerId !== userId) {
      return forbidden("You can only delete your own events");
    }

    // Atomic ownership re-check: fails if ownerId changed between read & write.
    await ddb.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { eventId },
        ConditionExpression: "ownerId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    );
    return noContent();
  } catch (err) {
    if ((err as { name?: string })?.name === "ConditionalCheckFailedException") {
      return forbidden("You can only delete your own events");
    }
    console.error("deleteEvent error", err);
    return serverError();
  }
};
