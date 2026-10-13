import { GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  noContent,
  badRequest,
  forbidden,
  notFound,
  serverError,
  getUserId,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";

const TABLE = process.env.POSTS_TABLE!;

/**
 * DELETE /posts/{postId} — author-only delete.
 * SECURITY: verifies authorId === JWT sub.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const postId = pathParam(event, "postId");
    if (!postId) return badRequest("Missing postId");

    const existing = await ddb.send(
      new GetCommand({ TableName: TABLE, Key: { postId } })
    );
    if (!existing.Item) return notFound("Post not found");
    if (existing.Item.authorId !== userId) {
      return forbidden("You can only delete your own posts");
    }

    // Atomic ownership re-check at write time (defense against TOCTOU races).
    await ddb.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { postId },
        ConditionExpression: "authorId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    );
    return noContent();
  } catch (err) {
    if ((err as { name?: string })?.name === "ConditionalCheckFailedException") {
      return forbidden("You can only delete your own posts");
    }
    console.error("deletePost error", err);
    return serverError();
  }
};
