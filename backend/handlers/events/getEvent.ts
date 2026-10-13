import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  notFound,
  badRequest,
  serverError,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";

const TABLE = process.env.EVENTS_TABLE!;

/** GET /events/{eventId} */
export const handler = async (event: ApiEvent) => {
  try {
    const eventId = pathParam(event, "eventId");
    if (!eventId) return badRequest("Missing eventId");

    const res = await ddb.send(
      new GetCommand({ TableName: TABLE, Key: { eventId } })
    );
    if (!res.Item) return notFound("Event not found");
    return ok(res.Item);
  } catch (err) {
    console.error("getEvent error", err);
    return serverError();
  }
};
