import { QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { ok, serverError, getUserId, type ApiEvent } from "../../shared/http.js";

const GROUPS_TABLE = process.env.GROUPS_TABLE!;
const GROUP_MEMBERS_TABLE = process.env.GROUP_MEMBERS_TABLE!;

/**
 * GET /me/groups — groups the current user belongs to.
 * Queries the GroupMembers `byUser` GSI, then batch-fetches the matching
 * groups so the Groups page can render full group details and persist
 * membership across sessions.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);

    const memberships = await ddb.send(
      new QueryCommand({
        TableName: GROUP_MEMBERS_TABLE,
        IndexName: "byUser",
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      })
    );

    const rows = memberships.Items ?? [];
    const groupIds = [...new Set(rows.map((r) => r.groupId))];
    if (groupIds.length === 0) return ok({ items: [] });

    // Batch-get groups (DynamoDB caps BatchGet at 100 keys; fine at demo scale).
    const res = await ddb.send(
      new BatchGetCommand({
        RequestItems: {
          [GROUPS_TABLE]: {
            Keys: groupIds.map((groupId) => ({ groupId })),
          },
        },
      })
    );

    const items = res.Responses?.[GROUPS_TABLE] ?? [];

    return ok({ items });
  } catch (err) {
    console.error("listMyGroups error", err);
    return serverError();
  }
};
