import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { ok, serverError, type ApiEvent } from "../../shared/http.js";

const EVENTS_TABLE = process.env.EVENTS_TABLE!;
const POSTS_TABLE = process.env.POSTS_TABLE!;
const GROUPS_TABLE = process.env.GROUPS_TABLE!;

/**
 * GET /activity — read-only aggregator for the central Activity dashboard.
 *
 * Runs one Scan per table in parallel, then trims each list server-side so the
 * frontend makes a single request:
 *   - recentEvents: upcoming only (no startsAt or startsAt >= now), soonest first, max 10
 *   - recentPosts:  newest first, max 15
 *   - activeGroups: newest first, max 10
 * Scan is fine at demo scale; swap to GSIs if these feeds grow.
 */
export const handler = async (_event: ApiEvent) => {
  try {
    const [eventsRes, postsRes, groupsRes] = await Promise.all([
      ddb.send(new ScanCommand({ TableName: EVENTS_TABLE })),
      ddb.send(new ScanCommand({ TableName: POSTS_TABLE })),
      ddb.send(new ScanCommand({ TableName: GROUPS_TABLE })),
    ]);

    const now = new Date();

    const recentEvents = (eventsRes.Items ?? [])
      .filter((e) => !e.startsAt || new Date(String(e.startsAt)) >= now)
      .sort(
        (a, b) =>
          new Date(String(a.startsAt)).getTime() -
          new Date(String(b.startsAt)).getTime()
      )
      .slice(0, 10);

    const recentPosts = (postsRes.Items ?? [])
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, 15);

    const activeGroups = (groupsRes.Items ?? [])
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, 10);

    return ok({ recentEvents, recentPosts, activeGroups });
  } catch (err) {
    console.error("getActivity error", err);
    return serverError();
  }
};
