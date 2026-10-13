import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  badRequest,
  serverError,
  getUserId,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";

const POSTS_TABLE = process.env.POSTS_TABLE!;
const LIKES_TABLE = process.env.POST_LIKES_TABLE!;

/**
 * POST /posts/{postId}/like — toggle the current user's like.
 * Uses PostLikes (PK postId, SK userId) to prevent double-likes, and keeps a
 * denormalized likeCount on the post via an atomic ADD.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const postId = pathParam(event, "postId");
    if (!postId) return badRequest("Missing postId");

    const existingLike = await ddb.send(
      new GetCommand({ TableName: LIKES_TABLE, Key: { postId, userId } })
    );

    let liked: boolean;
    let delta: number;

    if (existingLike.Item) {
      await ddb.send(
        new DeleteCommand({ TableName: LIKES_TABLE, Key: { postId, userId } })
      );
      liked = false;
      delta = -1;
    } else {
      await ddb.send(
        new PutCommand({
          TableName: LIKES_TABLE,
          Item: { postId, userId, createdAt: new Date().toISOString() },
        })
      );
      liked = true;
      delta = 1;
    }

    const res = await ddb.send(
      new UpdateCommand({
        TableName: POSTS_TABLE,
        Key: { postId },
        UpdateExpression: "ADD likeCount :d",
        ExpressionAttributeValues: { ":d": delta },
        ReturnValues: "UPDATED_NEW",
      })
    );

    const likeCount = Math.max(0, Number(res.Attributes?.likeCount ?? 0));
    return ok({ postId, liked, likeCount });
  } catch (err) {
    console.error("toggleLike error", err);
    return serverError();
  }
};
