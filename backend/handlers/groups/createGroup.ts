import { randomUUID } from "node:crypto";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  created,
  badRequest,
  serverError,
  getUserId,
  parseBody,
  type ApiEvent,
} from "../../shared/http.js";
import { moderateText } from "../../shared/moderation.js";

const TABLE = process.env.GROUPS_TABLE!;

interface GroupInput {
  name?: string;
  description?: string;
}

/** POST /groups — create a group owned by the current user. */
export const handler = async (event: ApiEvent) => {
  try {
    const ownerId = getUserId(event);
    const body = parseBody<GroupInput>(event);

    if (!body.name || !body.name.trim()) {
      return badRequest("name is required");
    }

    // Content moderation on user-visible text.
    const mod = moderateText(`${body.name} ${body.description ?? ""}`);
    if (!mod.allowed) return badRequest(mod.reason!);

    const item = {
      groupId: randomUUID(),
      name: body.name.trim(),
      description: body.description ?? "",
      ownerId,
      memberCount: 1,
      createdAt: new Date().toISOString(),
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
    return created(item);
  } catch (err) {
    console.error("createGroup error", err);
    return serverError();
  }
};
