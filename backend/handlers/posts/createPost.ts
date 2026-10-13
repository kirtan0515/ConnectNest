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

const TABLE = process.env.POSTS_TABLE!;

interface PostInput {
  content?: string;
  groupId?: string;
  imageKey?: string;
}

/** POST /posts — create a post authored by the current user. */
export const handler = async (event: ApiEvent) => {
  try {
    const authorId = getUserId(event);
    const body = parseBody<PostInput>(event);

    if (!body.content || !body.content.trim()) {
      return badRequest("content is required");
    }

    // Content moderation: reject disallowed language before storing.
    const mod = moderateText(body.content);
    if (!mod.allowed) return badRequest(mod.reason!);

    const item = {
      postId: randomUUID(),
      authorId,
      authorName: getName(event) ?? "",
      content: body.content.trim(),
      // "global" keeps the byGroup GSI populated for the main feed.
      groupId: body.groupId ?? "global",
      imageKey: body.imageKey,
      likeCount: 0,
      createdAt: new Date().toISOString(),
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
    return created(item);
  } catch (err) {
    console.error("createPost error", err);
    return serverError();
  }
};
