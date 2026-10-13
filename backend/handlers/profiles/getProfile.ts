import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  notFound,
  serverError,
  getUserId,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";

const TABLE = process.env.PROFILES_TABLE!;

/**
 * GET /profiles/me       -> current user's profile (from JWT sub)
 * GET /profiles/{userId} -> a specific user's profile (public read)
 */
export const handler = async (event: ApiEvent) => {
  try {
    const requested = pathParam(event, "userId");
    const userId = requested ?? getUserId(event);

    const res = await ddb.send(
      new GetCommand({ TableName: TABLE, Key: { userId } })
    );

    if (!res.Item) {
      // For "me", return an empty profile skeleton (exists:false signals the
      // frontend to run onboarding). For others, 404.
      if (!requested)
        return ok({ userId, name: "", major: "", interests: [], bio: "", exists: false });
      return notFound("Profile not found");
    }

    // PII minimization: only the owner (/profiles/me) sees their email.
    // Public lookups (/profiles/{userId}) get a reduced, non-sensitive view —
    // and deactivated / pending-deletion accounts are hidden entirely.
    const isSelf = !requested || requested === getUserId(event);
    if (!isSelf) {
      const status = res.Item.status;
      if (status === "deactivated" || status === "pending_deletion") {
        return notFound("Profile not found");
      }
      const { email, ...publicView } = res.Item;
      return ok({ ...publicView, exists: true });
    }
    return ok({ ...res.Item, exists: true });
  } catch (err) {
    console.error("getProfile error", err);
    return serverError();
  }
};
