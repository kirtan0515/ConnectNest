import { QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { ok, serverError, getUserId, type ApiEvent } from "../../shared/http.js";

const EVENTS_TABLE = process.env.EVENTS_TABLE!;
const RSVPS_TABLE = process.env.RSVPS_TABLE!;

/**
 * GET /me/rsvps — events the current user has RSVP'd to.
 * Queries the RSVPs `byUser` GSI, then batch-fetches the matching events so
 * the Profile "Events" tab can render full event details.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);

    const rsvps = await ddb.send(
      new QueryCommand({
        TableName: RSVPS_TABLE,
        IndexName: "byUser",
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      })
    );

    const rows = rsvps.Items ?? [];
    const eventIds = [...new Set(rows.map((r) => r.eventId))];
    if (eventIds.length === 0) return ok({ items: [] });

    // Batch-get events (DynamoDB caps BatchGet at 100 keys; fine at demo scale).
    const res = await ddb.send(
      new BatchGetCommand({
        RequestItems: {
          [EVENTS_TABLE]: {
            Keys: eventIds.map((eventId) => ({ eventId })),
          },
        },
      })
    );

    const events = (res.Responses?.[EVENTS_TABLE] ?? []).sort((a, b) =>
      String(a.startsAt).localeCompare(String(b.startsAt))
    );

    // Attach the user's RSVP status to each event.
    const statusById = Object.fromEntries(rows.map((r) => [r.eventId, r.status]));
    const items = events.map((e) => ({ ...e, myStatus: statusById[e.eventId] }));

    return ok({ items });
  } catch (err) {
    console.error("listMyRsvps error", err);
    return serverError();
  }
};
