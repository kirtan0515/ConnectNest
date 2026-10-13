import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  badRequest,
  serverError,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";

const RSVPS_TABLE = process.env.RSVPS_TABLE!;

/**
 * GET /events/{eventId}/rsvps — list attendees for an event.
 * Queries the RSVPs table by eventId (partition key).
 */
export const handler = async (event: ApiEvent) => {
  try {
    const eventId = pathParam(event, "eventId");
    if (!eventId) return badRequest("Missing eventId");

    const res = await ddb.send(
      new QueryCommand({
        TableName: RSVPS_TABLE,
        KeyConditionExpression: "eventId = :e",
        ExpressionAttributeValues: { ":e": eventId },
      })
    );

    const items = res.Items ?? [];
    return ok({ items, count: items.length });
  } catch (err) {
    console.error("listAttendees error", err);
    return serverError();
  }
};
