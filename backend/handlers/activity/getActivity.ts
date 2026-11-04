import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { scanAll } from "../../shared/scan.js";
import { ok, serverError, type ApiEvent } from "../../shared/http.js";

const EVENTS_TABLE = process.env.EVENTS_TABLE!;
const POSTS_TABLE = process.env.POSTS_TABLE!;
const GROUPS_TABLE = process.env.GROUPS_TABLE!;

/**
 * GET /activity — read-only aggregator for the central Activity dashboard.
 *
 * One request returns the three sections the dashboard renders:
 *   - recentEvents: upcoming only (no startsAt or startsAt >= now), soonest first, max 10
 *   - recentPosts:  the 15 newest global-feed posts (indexed Query, no Scan)
 *   - activeGroups: newest first, max 10
 * Events and groups still scan (paginated) because they have no date/status
 * index; swap to GSIs if those lists grow large.
 */
export const handler = async (_event: ApiEvent) => {
  try {
    const [events, postsRes, groups] = await Promise.all([
      scanAll({ TableName: EVENTS_TABLE }),
      ddb.send(
        new QueryCommand({
          TableName: POSTS_TABLE,
          IndexName: "byGroup",
          KeyConditionExpression: "groupId = :g",
          ExpressionAttributeValues: { ":g": "global" },
          ScanIndexForward: false,
          Limit: 15,
        })
      ),
      scanAll({ TableName: GROUPS_TABLE }),
    ]);
    const now = new Date();
    const recentEvents = events
      .filter((e) => !e.startsAt || new Date(String(e.startsAt)) >= now)
      .sort(
        (a, b) =>
          new Date(String(a.startsAt)).getTime() -
          new Date(String(b.startsAt)).getTime()
      )
      .slice(0, 10);
    const recentPosts = postsRes.Items ?? [];
    const activeGroups = groups
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, 10);
    return ok({ recentEvents, recentPosts, activeGroups });
  } catch (err) {
    console.error("getActivity error", err);
    return serverError();
  }
};
