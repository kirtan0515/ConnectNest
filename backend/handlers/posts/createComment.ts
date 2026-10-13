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
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";
import { moderateText } from "../../shared/moderation.js";

const TABLE = process.env.COMMENTS_TABLE!;

interface CommentInput {
  content?: string;
}

/** POST /posts/{postId}/comments — add a comment authored by the current user. */
export const handler = async (event: ApiEvent) => {
  try {
    const authorId = getUserId(event);
    const postId = pathParam(event, "postId");
    if (!postId) return badRequest("Missing postId");

    const body = parseBody<CommentInput>(event);
    if (!body.content || !body.content.trim()) {
      return badRequest("content is required");
    }

    // Content moderation: reject disallowed language before storing.
    const mod = moderateText(body.content);
    if (!mod.allowed) return badRequest(mod.reason!);

    const item = {
      postId,
      commentId: `${Date.now()}#${randomUUID()}`,
      authorId,
      authorName: getName(event) ?? "",
      content: body.content.trim(),
      createdAt: new Date().toISOString(),
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
    return created(item);
  } catch (err) {
    console.error("createComment error", err);
    return serverError();
  }
};
