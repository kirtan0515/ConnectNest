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
  getName,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";
import { notify } from "../../shared/notifications.js";

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

    // Notify the post author on a new like only (not on unlike).
    if (liked) {
      try {
        const post = await ddb.send(
          new GetCommand({ TableName: POSTS_TABLE, Key: { postId } })
        );
        if (post.Item) {
          const actorName = getName(event) ?? "Someone";
          await notify({
            recipientId: String(post.Item.authorId ?? ""),
            actorId: userId,
            actorName,
            type: "post.like",
            message: `${actorName} liked your post`,
            link: "/dashboard",
          });
        }
      } catch (e) {
        console.error("toggleLike notify lookup error", e);
      }
    }

    return ok({ postId, liked, likeCount });
  } catch (err) {
    console.error("toggleLike error", err);
    return serverError();
  }
};
