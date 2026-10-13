import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  badRequest,
  notFound,
  serverError,
  getUserId,
  getName,
  parseBody,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";

const EVENTS_TABLE = process.env.EVENTS_TABLE!;
const RSVPS_TABLE = process.env.RSVPS_TABLE!;

interface RsvpInput {
  status?: "going" | "interested";
  // When true, remove the RSVP (toggle off).
  cancel?: boolean;
}

/**
 * POST /events/{eventId}/rsvp — current user RSVPs to an event.
 * Idempotent. SECURITY: userId comes from the verified JWT, never the body.
 * Body: { status?: "going" | "interested", cancel?: boolean }
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const eventId = pathParam(event, "eventId");
    if (!eventId) return badRequest("Missing eventId");

    const existing = await ddb.send(
      new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId } })
    );
    if (!existing.Item) return notFound("Event not found");

    const body = parseBody<RsvpInput>(event);

    if (body.cancel) {
      await ddb.send(
        new DeleteCommand({ TableName: RSVPS_TABLE, Key: { eventId, userId } })
      );
      return ok({ eventId, userId, rsvped: false });
    }

    const status = body.status === "interested" ? "interested" : "going";
    await ddb.send(
      new PutCommand({
        TableName: RSVPS_TABLE,
        Item: {
          eventId,
          userId,
          userName: getName(event) ?? "",
          status,
          createdAt: new Date().toISOString(),
        },
      })
    );

    return ok({ eventId, userId, rsvped: true, status });
  } catch (err) {
    console.error("rsvpToEvent error", err);
    return serverError();
  }
};
