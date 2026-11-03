import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  noContent,
  badRequest,
  forbidden,
  serverError,
  getUserId,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";

const TABLE = process.env.COMMENTS_TABLE!;

/**
 * DELETE /posts/{postId}/comments/{commentId} — author-only delete.
 * SECURITY: the delete is conditional on authorId === JWT sub, so a user can
 * only remove their own comment and the check is atomic at write time.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const postId = pathParam(event, "postId");
    const commentId = pathParam(event, "commentId");
    if (!postId || !commentId) return badRequest("Missing postId or commentId");

    await ddb.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { postId, commentId },
        ConditionExpression: "authorId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    );
    return noContent();
  } catch (err) {
    if ((err as { name?: string })?.name === "ConditionalCheckFailedException") {
      // Either the comment is gone or it belongs to someone else.
      return forbidden("You can only delete your own comments");
    }
    console.error("deleteComment error", err);
    return serverError();
  }
};
