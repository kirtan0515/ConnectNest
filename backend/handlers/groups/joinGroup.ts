import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  badRequest,
  notFound,
  serverError,
  getUserId,
  getName,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";
import { notify } from "../../shared/notifications.js";

const GROUPS_TABLE = process.env.GROUPS_TABLE!;
const MEMBERS_TABLE = process.env.GROUP_MEMBERS_TABLE!;

/**
 * POST /groups/{groupId}/join — current user joins a group (idempotent).
 * Writes a GroupMembers row keyed by (groupId, userId from JWT).
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const groupId = pathParam(event, "groupId");
    if (!groupId) return badRequest("Missing groupId");

    const group = await ddb.send(
      new GetCommand({ TableName: GROUPS_TABLE, Key: { groupId } })
    );
    if (!group.Item) return notFound("Group not found");

    await ddb.send(
      new PutCommand({
        TableName: MEMBERS_TABLE,
        Item: {
          groupId,
          userId,
          role: "member",
          joinedAt: new Date().toISOString(),
        },
      })
    );

    const actorName = getName(event) ?? "Someone";
    await notify({
      recipientId: String(group.Item.ownerId ?? ""),
      actorId: userId,
      actorName,
      type: "group.join",
      message: `${actorName} joined your group "${group.Item.name ?? "group"}"`,
      link: `/groups/${groupId}`,
    });

    return ok({ groupId, userId, joined: true });
  } catch (err) {
    console.error("joinGroup error", err);
    return serverError();
  }
};
