/**
 * Pure event-recommendation scoring, split out from the handler so it can be
 * unit-tested without DynamoDB. No AWS imports here on purpose.
 *
 * Signals (all transparent, no ML):
 *   - organizer affinity: events hosted by someone whose events the user has
 *     RSVP'd to before (+5)
 *   - popularity: log2(rsvpCount + 1) * 2
 *   - freshness: sooner events get up to +1 as a tie-breaker
 * Excludes events the user already RSVP'd to, the user's own events, and events
 * that have already started.
 */
type Row = Record<string, unknown>;

export interface ScoredEvent extends Row {
  eventId: string;
  score: number;
  reasons: string[];
}

export interface ScoreInput {
  userId: string;
  events: Row[];
  allRsvps: Row[];
  myRsvps: Row[];
  myGroupCount: number;
  now: number;
}

export interface ScoreOutput {
  items: ScoredEvent[];
  personalized: boolean;
}

export function scoreEvents(input: ScoreInput): ScoreOutput {
  const { userId, events, allRsvps, myRsvps, myGroupCount, now } = input;

  const myEventIds = new Set(myRsvps.map((r) => String(r.eventId)));

  const rsvpCount = new Map<string, number>();
  for (const r of allRsvps) {
    const id = String(r.eventId);
    rsvpCount.set(id, (rsvpCount.get(id) ?? 0) + 1);
  }

  const ownerById = new Map<string, string>();
  for (const e of events) ownerById.set(String(e.eventId), String(e.ownerId ?? ""));

  const affinityOwners = new Set<string>();
  for (const id of myEventIds) {
    const owner = ownerById.get(id);
    if (owner) affinityOwners.add(owner);
  }

  const scored: ScoredEvent[] = [];

  for (const e of events) {
    const id = String(e.eventId);
    if (myEventIds.has(id)) continue; // already going / interested
    if (String(e.ownerId) === userId) continue; // don't recommend your own

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
      reasons.push(count === 1 ? "1 person is going" : `${count} people are going`);
    }

    if (startsAt !== null && !Number.isNaN(startsAt)) {
      const days = (startsAt - now) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 1 - days / 30);
    }

    if (reasons.length === 0) reasons.push("Popular on campus");

    scored.push({ ...(e as Row), eventId: id, score, reasons });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return String(a.startsAt).localeCompare(String(b.startsAt));
  });

  return {
    items: scored.slice(0, 8),
    personalized: myEventIds.size > 0 || myGroupCount > 0,
  };
}
