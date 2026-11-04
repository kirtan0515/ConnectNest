import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { ok, serverError, getUserId, type ApiEvent } from "../../shared/http.js";
import { scanAll } from "../../shared/scan.js";
import { scoreEvents } from "./recommend.js";

const EVENTS_TABLE = process.env.EVENTS_TABLE!;
const RSVPS_TABLE = process.env.RSVPS_TABLE!;
const GROUP_MEMBERS_TABLE = process.env.GROUP_MEMBERS_TABLE!;

/**
 * GET /me/recommendations — upcoming events suggested for the current user.
 *
 * ConnectNest has no ML pipeline; this is a transparent, rule-based score built
 * from the signals we already store:
 *   - organizer affinity: events hosted by someone whose events the user has
 *     RSVP'd to before (a simple collaborative signal)
 *   - popularity: events with more RSVPs rank higher (log-scaled so one busy
 *     event can't dominate)
 *   - freshness: sooner events edge ahead as a tie-breaker
 *
 * Events the user already RSVP'd to and events in the past are excluded. Each
 * result carries human-readable `reasons`, so the UI can explain the pick.
 * Scans are fine at demo scale; swap to GSIs if these feeds grow.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);

    const [eventsRes, rsvpsRes, myRsvpsRes, myGroupsRes] = await Promise.all([
      scanAll({ TableName: EVENTS_TABLE }),
      scanAll({ TableName: RSVPS_TABLE }),
      ddb.send(
        new QueryCommand({
          TableName: RSVPS_TABLE,
          IndexName: "byUser",
          KeyConditionExpression: "userId = :u",
          ExpressionAttributeValues: { ":u": userId },
        })
      ),
      ddb.send(
        new QueryCommand({
          TableName: GROUP_MEMBERS_TABLE,
          IndexName: "byUser",
          KeyConditionExpression: "userId = :u",
          ExpressionAttributeValues: { ":u": userId },
        })
      ),
    ]);

    const { items, personalized } = scoreEvents({
      userId,
      events: eventsRes,
      allRsvps: rsvpsRes,
      myRsvps: myRsvpsRes.Items ?? [],
      myGroupCount: (myGroupsRes.Items ?? []).length,
      now: Date.now(),
    });

    return ok({ items, personalized });
  } catch (err) {
    console.error("getRecommendations error", err);
    return serverError();
  }
};
