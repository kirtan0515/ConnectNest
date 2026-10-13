import { randomUUID } from "node:crypto";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  created,
  badRequest,
  serverError,
  getUserId,
  getName,
  parseBody,
  type ApiEvent,
} from "../../shared/http.js";
import { moderateText } from "../../shared/moderation.js";

const TABLE = process.env.EVENTS_TABLE!;

interface EventInput {
  title?: string;
  description?: string;
  location?: string;
  startsAt?: string;
  imageKey?: string;
}

/**
 * POST /events — create an event owned by the current user.
 * SECURITY: ownerId is taken from the JWT, never the request body.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const ownerId = getUserId(event);
    const body = parseBody<EventInput>(event);

    if (!body.title || !body.title.trim()) {
      return badRequest("title is required");
    }

    // Content moderation on user-visible text.
    const mod = moderateText(`${body.title} ${body.description ?? ""}`);
    if (!mod.allowed) return badRequest(mod.reason!);

    const now = new Date().toISOString();
    const item = {
      eventId: randomUUID(),
      title: body.title.trim(),
      description: body.description ?? "",
      location: body.location ?? "",
      startsAt: body.startsAt ?? "",
      imageKey: body.imageKey,
      ownerId,
      ownerName: getName(event) ?? "",
      createdAt: now,
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
    return created(item);
  } catch (err) {
    console.error("createEvent error", err);
    return serverError();
  }
};
