import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  serverError,
  getUserId,
  getEmail,
  parseBody,
  type ApiEvent,
} from "../../shared/http.js";

const TABLE = process.env.PROFILES_TABLE!;

interface ProfileInput {
  name?: string;
  major?: string;
  interests?: string[];
  bio?: string;
  avatarKey?: string;
}

/**
 * PUT /profiles/me — create or update the current user's profile.
 * SECURITY: userId comes from the JWT, so a user can only edit their own profile.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const body = parseBody<ProfileInput>(event);
    const now = new Date().toISOString();

    const item = {
      userId,
      email: getEmail(event),
      name: body.name ?? "",
      major: body.major ?? "",
      interests: Array.isArray(body.interests) ? body.interests : [],
      bio: body.bio ?? "",
      avatarKey: body.avatarKey,
      updatedAt: now,
    };

    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: item,
      })
    );

    return ok(item);
  } catch (err) {
    console.error("upsertProfile error", err);
    return serverError();
  }
};
