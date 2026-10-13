import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  badRequest,
  serverError,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";

const GROUP_MEMBERS_TABLE = process.env.GROUP_MEMBERS_TABLE!;

/**
 * GET /groups/{groupId}/members — list members of a group.
 * Queries the GroupMembers table by groupId (partition key).
 */
export const handler = async (event: ApiEvent) => {
  try {
    const groupId = pathParam(event, "groupId");
    if (!groupId) return badRequest("Missing groupId");

    const res = await ddb.send(
      new QueryCommand({
        TableName: GROUP_MEMBERS_TABLE,
        KeyConditionExpression: "groupId = :g",
        ExpressionAttributeValues: { ":g": groupId },
      })
    );

    const items = res.Items ?? [];
    return ok({ items, count: items.length });
  } catch (err) {
    console.error("listMembers error", err);
    return serverError();
  }
};
