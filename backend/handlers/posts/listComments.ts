import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  badRequest,
  serverError,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";

const TABLE = process.env.COMMENTS_TABLE!;

/** GET /posts/{postId}/comments — all comments on a post. */
export const handler = async (event: ApiEvent) => {
  try {
    const postId = pathParam(event, "postId");
    if (!postId) return badRequest("Missing postId");

    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "postId = :p",
        ExpressionAttributeValues: { ":p": postId },
      })
    );
    return ok({ items: res.Items ?? [] });
  } catch (err) {
    console.error("listComments error", err);
    return serverError();
  }
};
