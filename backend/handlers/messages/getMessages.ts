import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  badRequest,
  forbidden,
  serverError,
  getUserId,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";
import { isParticipant } from "../../shared/dm.js";

const MESSAGES_TABLE = process.env.MESSAGES_TABLE!;
const MEMBERS_TABLE = process.env.CONVERSATION_MEMBERS_TABLE!;

/**
 * GET /me/conversations/{conversationId}/messages — the messages in one thread,
 * oldest first. Only a participant may read it. Opening the thread marks it read
 * (updates lastReadAt on the caller's member row).
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const conversationId = pathParam(event, "conversationId");
    if (!conversationId) return badRequest("Missing conversationId");

    // Authorization: the id encodes its two participants.
    if (!isParticipant(conversationId, userId)) {
      return forbidden("Not a participant in this conversation");
    }

    const res = await ddb.send(
      new QueryCommand({
        TableName: MESSAGES_TABLE,
        KeyConditionExpression: "conversationId = :c",
        ExpressionAttributeValues: { ":c": conversationId },
        ScanIndexForward: true, // messageId starts with ISO ts -> chronological
        Limit: 100,
      })
    );

    // Mark read for this user (best-effort; a missing member row is fine).
    try {
      await ddb.send(
        new UpdateCommand({
          TableName: MEMBERS_TABLE,
          Key: { userId, conversationId },
          UpdateExpression: "SET lastReadAt = :t",
          ConditionExpression: "attribute_exists(conversationId)",
          ExpressionAttributeValues: { ":t": new Date().toISOString() },
        })
      );
    } catch {
      /* no member row yet (no messages exchanged) — nothing to mark */
    }

    return ok({ items: res.Items ?? [] });
  } catch (err) {
    console.error("getMessages error", err);
    return serverError();
  }
};
