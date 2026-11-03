import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { ok, serverError, getUserId, type ApiEvent } from "../../shared/http.js";

const EVENTS_TABLE = process.env.EVENTS_TABLE!;
const RSVPS_TABLE = process.env.RSVPS_TABLE!;
const GROUP_MEMBERS_TABLE = process.env.GROUP_MEMBERS_TABLE!;

interface ScoredEvent {
  eventId: string;
  score: number;
  reasons: string[];
  [k: string]: unknown;
}

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
      ddb.send(new ScanCommand({ TableName: EVENTS_TABLE })),
      ddb.send(new ScanCommand({ TableName: RSVPS_TABLE })),
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

    const allEvents = eventsRes.Items ?? [];
    const allRsvps = rsvpsRes.Items ?? [];
    const myRsvps = myRsvpsRes.Items ?? [];
    const myGroupCount = (myGroupsRes.Items ?? []).length;

    // Events the user already responded to — never recommend these.
    const myEventIds = new Set(myRsvps.map((r) => String(r.eventId)));

    // RSVP count per event, for the popularity signal.
    const rsvpCount = new Map<string, number>();
    for (const r of allRsvps) {
      const id = String(r.eventId);
      rsvpCount.set(id, (rsvpCount.get(id) ?? 0) + 1);
    }

    // Organizers whose events the user has attended before.
    const affinityOwners = new Set<string>();
    const ownerById = new Map<string, string>();
    for (const e of allEvents) ownerById.set(String(e.eventId), String(e.ownerId ?? ""));
    for (const id of myEventIds) {
      const owner = ownerById.get(id);
      if (owner) affinityOwners.add(owner);
    }

    const now = Date.now();
    const scored: ScoredEvent[] = [];

    for (const e of allEvents) {
      const id = String(e.eventId);
      if (myEventIds.has(id)) continue; // already going / interested
      if (String(e.ownerId) === userId) continue; // don't recommend your own

      // Skip events that have already started (keep those with no date).
      const startsAt = e.startsAt ? new Date(String(e.startsAt)).getTime() : null;
      if (startsAt !== null && !Number.isNaN(startsAt) && startsAt < now) continue;

      const reasons: string[] = [];
      let score = 0;

      if (affinityOwners.has(String(e.ownerId))) {
        score += 5;
        reasons.push("From an organizer you've joined before");
      }

      const count = rsvpCount.get(id) ?? 0;
      if (count > 0) {
        score += Math.log2(count + 1) * 2;
        reasons.push(
          count === 1 ? "1 person is going" : `${count} people are going`
        );
      }

      // Freshness tie-breaker: sooner events score slightly higher (max ~1).
      if (startsAt !== null && !Number.isNaN(startsAt)) {
        const days = (startsAt - now) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 1 - days / 30);
      }

      // New users with no history: surface popular upcoming events anyway.
      if (reasons.length === 0) reasons.push("Popular on campus");

      scored.push({ ...(e as Record<string, unknown>), eventId: id, score, reasons });
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Equal score: sooner first.
      return String(a.startsAt).localeCompare(String(b.startsAt));
    });

    return ok({
      items: scored.slice(0, 8),
      // Small hint the UI can use to tailor its heading copy.
      personalized: myEventIds.size > 0 || myGroupCount > 0,
    });
  } catch (err) {
    console.error("getRecommendations error", err);
    return serverError();
  }
};
