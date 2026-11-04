import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  badRequest,
  serverError,
  type ApiEvent,
} from "../../shared/http.js";
import {
  encodeToken,
  decodeToken,
  clampLimit,
  InvalidTokenError,
} from "../../shared/pagination.js";

const TABLE = process.env.POSTS_TABLE!;

/**
 * GET /posts
 *   (no params)      -> the global feed: posts with groupId "global", newest first
 *   ?groupId=X       -> posts for one group / chat room (byGroup GSI)
 *   ?authorId=X      -> one author's posts, newest first (byAuthor GSI)
 *   ?limit=N         -> page size, default 50, max 100
 *   ?nextToken=...   -> continue from a previous response's nextToken
 *
 * Every variant is an indexed Query (no table Scan). The global feed is scoped
 * to the "global" partition on purpose: group posts and chat-room messages are
 * stored in the same table under their own groupId and must not appear in
 * everyone's main feed.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const qs = event.queryStringParameters ?? {};
    const limit = clampLimit(qs.limit);

    let indexName: string;
    let keyAttr: string;
    let keyValue: string;
    let tokenKeys: string[];

    if (qs.authorId) {
      indexName = "byAuthor";
      keyAttr = "authorId";
      keyValue = qs.authorId;
      tokenKeys = ["postId", "authorId", "createdAt"];
    } else {
      indexName = "byGroup";
      keyAttr = "groupId";
      keyValue = qs.groupId || "global";
      tokenKeys = ["postId", "groupId", "createdAt"];
    }

    const startKey = decodeToken(qs.nextToken, tokenKeys);
    // The token must belong to the partition being queried.
    if (startKey && startKey[keyAttr] !== keyValue) {
      return badRequest("Invalid pagination token");
    }

    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: indexName,
        KeyConditionExpression: "#k = :v",
        ExpressionAttributeNames: { "#k": keyAttr },
        ExpressionAttributeValues: { ":v": keyValue },
        ScanIndexForward: false, // newest first (sort key is createdAt)
        Limit: limit,
        ExclusiveStartKey: startKey,
      })
    );

    return ok({
      items: res.Items ?? [],
      nextToken: encodeToken(res.LastEvaluatedKey),
    });
  } catch (err) {
    if (err instanceof InvalidTokenError) return badRequest(err.message);
    console.error("listPosts error", err);
    return serverError();
  }
};
