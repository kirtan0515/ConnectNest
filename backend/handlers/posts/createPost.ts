import { randomUUID } from "node:crypto";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  created,
  badRequest,
  forbidden,
  serverError,
  getUserId,
  getName,
  parseBody,
  type ApiEvent,
} from "../../shared/http.js";
import { broadcast } from "../../shared/broadcast.js";
import { moderateText } from "../../shared/moderation.js";
import { requiresMembership } from "../../shared/rooms.js";

const TABLE = process.env.POSTS_TABLE!;
const MEMBERS_TABLE = process.env.GROUP_MEMBERS_TABLE!;

interface PostInput {
  content?: string;
  groupId?: string;
  imageKey?: string;
}

/** POST /posts — create a post authored by the current user. */
export const handler = async (event: ApiEvent) => {
  try {
    const authorId = getUserId(event);
    const body = parseBody<PostInput>(event);

    if (!body.content || !body.content.trim()) {
      return badRequest("content is required");
    }

    // Content moderation: reject disallowed language before storing.
    const mod = moderateText(body.content);
    if (!mod.allowed) return badRequest(mod.reason!);

    // Group-scoped posts require membership. Enforce only for a real group
    // (not an open room like the main feed or the Messages chat room). Identity
    // comes from the verified JWT.
    const requestedGroupId = body.groupId?.trim();
    if (requestedGroupId && requiresMembership(requestedGroupId)) {
      const member = await ddb.send(
        new GetCommand({
          TableName: MEMBERS_TABLE,
          Key: { groupId: requestedGroupId, userId: authorId },
        })
      );
      if (!member.Item) return forbidden("Not a member of this group");
    }

    const item = {
      postId: randomUUID(),
      authorId,
      authorName: getName(event) ?? "",
      content: body.content.trim(),
      // "global" keeps the byGroup GSI populated for the main feed.
      groupId: body.groupId ?? "global",
      imageKey: body.imageKey,
      likeCount: 0,
      createdAt: new Date().toISOString(),
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
    await broadcast({ type: "post.created", item });
    return created(item);
  } catch (err) {
    console.error("createPost error", err);
    return serverError();
  }
};
