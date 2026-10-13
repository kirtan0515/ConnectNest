import { ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { ok, serverError, type ApiEvent } from "../../shared/http.js";

const TABLE = process.env.POSTS_TABLE!;

/**
 * GET /posts           -> all posts newest first (global feed)
 * GET /posts?groupId=X -> posts for a group via the byGroup GSI
 */
export const handler = async (event: ApiEvent) => {
  try {
    const groupId = event.queryStringParameters?.groupId;

    if (groupId) {
      const res = await ddb.send(
        new QueryCommand({
          TableName: TABLE,
          IndexName: "byGroup",
          KeyConditionExpression: "groupId = :g",
          ExpressionAttributeValues: { ":g": groupId },
          ScanIndexForward: false,
        })
      );
      return ok({ items: res.Items ?? [] });
    }

    const res = await ddb.send(new ScanCommand({ TableName: TABLE }));
    const items = (res.Items ?? []).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
    return ok({ items });
  } catch (err) {
    console.error("listPosts error", err);
    return serverError();
  }
};
