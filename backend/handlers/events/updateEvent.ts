import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  badRequest,
  forbidden,
  notFound,
  serverError,
  getUserId,
  parseBody,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";

const TABLE = process.env.EVENTS_TABLE!;

interface EventUpdate {
  title?: string;
  description?: string;
  location?: string;
  startsAt?: string;
  imageKey?: string;
}

/**
 * PUT /events/{eventId} — owner-only update.
 * SECURITY: verifies ownerId === JWT sub before writing.
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
      return forbidden("You can only edit your own events");
    }

    const body = parseBody<EventUpdate>(event);
    const updated = {
      ...existing.Item,
      title: body.title ?? existing.Item.title,
      description: body.description ?? existing.Item.description,
      location: body.location ?? existing.Item.location,
      startsAt: body.startsAt ?? existing.Item.startsAt,
      imageKey: body.imageKey ?? existing.Item.imageKey,
      updatedAt: new Date().toISOString(),
    };

    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: updated,
        ConditionExpression: "ownerId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    );
    return ok(updated);
  } catch (err) {
    if ((err as { name?: string })?.name === "ConditionalCheckFailedException") {
      return forbidden("You can only edit your own events");
    }
    console.error("updateEvent error", err);
    return serverError();
  }
};
