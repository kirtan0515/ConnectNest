import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  badRequest,
  forbidden,
  serverError,
  getUserId,
  parseBody,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";
import { moderateText } from "../../shared/moderation.js";

const TABLE = process.env.COMMENTS_TABLE!;

interface UpdateInput {
  content?: string;
}

/**
 * PUT /posts/{postId}/comments/{commentId} — author-only edit.
 * SECURITY: the update is conditional on authorId === JWT sub, so a user can
 * only edit their own comment and the check is atomic at write time.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const postId = pathParam(event, "postId");
    const commentId = pathParam(event, "commentId");
    if (!postId || !commentId) return badRequest("Missing postId or commentId");

    const body = parseBody<UpdateInput>(event);
    if (!body.content || !body.content.trim()) {
      return badRequest("content is required");
    }
    // Same moderation gate as creating a comment.
    const mod = moderateText(body.content);
    if (!mod.allowed) return badRequest(mod.reason!);

    const res = await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { postId, commentId },
        ConditionExpression: "authorId = :uid",
        UpdateExpression: "SET content = :c, editedAt = :t",
        ExpressionAttributeValues: {
          ":uid": userId,
          ":c": body.content.trim(),
          ":t": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      })
    );
    return ok(res.Attributes);
  } catch (err) {
    if ((err as { name?: string })?.name === "ConditionalCheckFailedException") {
      return forbidden("You can only edit your own comments");
    }
    console.error("updateComment error", err);
    return serverError();
  }
};
