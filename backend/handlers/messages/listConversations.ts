import { QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { ok, serverError, getUserId, type ApiEvent } from "../../shared/http.js";

const MEMBERS_TABLE = process.env.CONVERSATION_MEMBERS_TABLE!;
const PROFILES_TABLE = process.env.PROFILES_TABLE!;

/**
 * GET /me/conversations — the current user's direct-message threads, newest
 * activity first. Each item carries the other participant's name and an
 * `unread` flag (lastMessageAt > lastReadAt). One Query on the member rows plus
 * one BatchGet for the other users' names.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const res = await ddb.send(
      new QueryCommand({
        TableName: MEMBERS_TABLE,
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      })
    );
    const rows = res.Items ?? [];
    if (rows.length === 0) return ok({ items: [] });

    const otherIds = [...new Set(rows.map((r) => String(r.otherUserId)))];
    const names = new Map<string, string>();
    if (otherIds.length > 0) {
      const batch = await ddb.send(
        new BatchGetCommand({
          RequestItems: {
            [PROFILES_TABLE]: {
              Keys: otherIds.map((id) => ({ userId: id })),
              ProjectionExpression: "userId, #n",
              ExpressionAttributeNames: { "#n": "name" },
            },
          },
        })
      );
      for (const p of batch.Responses?.[PROFILES_TABLE] ?? []) {
        names.set(String(p.userId), String(p.name ?? ""));
      }
    }

    const items = rows
      .map((r) => ({
        conversationId: r.conversationId,
        otherUserId: r.otherUserId,
        otherUserName: names.get(String(r.otherUserId)) ?? "",
        lastMessageAt: r.lastMessageAt ?? "",
        unread:
          !!r.lastMessageAt &&
          (!r.lastReadAt || String(r.lastMessageAt) > String(r.lastReadAt)),
      }))
      .sort((a, b) => String(b.lastMessageAt).localeCompare(String(a.lastMessageAt)));

    return ok({ items });
  } catch (err) {
    console.error("listConversations error", err);
    return serverError();
  }
};
