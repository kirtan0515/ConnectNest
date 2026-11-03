import { describe, it, expect } from "vitest";
import { scoreEvents } from "./recommend.js";

const NOW = Date.UTC(2026, 0, 1); // fixed "now" for deterministic freshness
const future = (days: number) =>
  new Date(NOW + days * 24 * 60 * 60 * 1000).toISOString();

describe("scoreEvents", () => {
  it("excludes events the user already RSVP'd to and their own events", () => {
    const events = [
      { eventId: "e1", ownerId: "owner", startsAt: future(5) },
      { eventId: "mine", ownerId: "me", startsAt: future(5) },
      { eventId: "going", ownerId: "owner", startsAt: future(5) },
    ];
    const { items } = scoreEvents({
      userId: "me",
      events,
      allRsvps: [],
      myRsvps: [{ eventId: "going" }],
      myGroupCount: 0,
      now: NOW,
    });
    const ids = items.map((i) => i.eventId);
    expect(ids).toContain("e1");
    expect(ids).not.toContain("mine");
    expect(ids).not.toContain("going");
  });

  it("drops events that have already started but keeps dateless ones", () => {
    const events = [
      { eventId: "past", ownerId: "o", startsAt: future(-3) },
      { eventId: "soon", ownerId: "o", startsAt: future(2) },
      { eventId: "nodate", ownerId: "o" },
    ];
    const ids = scoreEvents({
      userId: "me",
      events,
      allRsvps: [],
      myRsvps: [],
      myGroupCount: 0,
      now: NOW,
    }).items.map((i) => i.eventId);
    expect(ids).not.toContain("past");
    expect(ids).toEqual(expect.arrayContaining(["soon", "nodate"]));
  });

  it("ranks organizer affinity above a modestly popular event", () => {
    // Affinity is +5. Popularity is log2(count+1)*2, so it only overtakes
    // affinity once an event has many RSVPs (>~6). With a couple of RSVPs the
    // affinity pick should win — the common campus case.
    const events = [
      { eventId: "attended", ownerId: "alice", startsAt: future(-1) }, // past; drives affinity only
      { eventId: "affinity", ownerId: "alice", startsAt: future(10) },
      { eventId: "popular", ownerId: "bob", startsAt: future(10) },
    ];
    const allRsvps = [
      { eventId: "popular", userId: "u1" },
      { eventId: "popular", userId: "u2" },
      { eventId: "attended", userId: "me" },
    ];
    const { items, personalized } = scoreEvents({
      userId: "me",
      events,
      allRsvps,
      myRsvps: [{ eventId: "attended" }],
      myGroupCount: 0,
      now: NOW,
    });
    expect(personalized).toBe(true);
    expect(items[0].eventId).toBe("affinity");
    expect(items[0].reasons[0]).toMatch(/organizer/i);
  });

  it("lets a very popular event overtake affinity (popularity is log-scaled)", () => {
    const events = [
      { eventId: "attended", ownerId: "alice", startsAt: future(-1) },
      { eventId: "affinity", ownerId: "alice", startsAt: future(10) },
      { eventId: "viral", ownerId: "bob", startsAt: future(10) },
    ];
    const allRsvps = [
      ...Array.from({ length: 15 }, (_, i) => ({ eventId: "viral", userId: `u${i}` })),
      { eventId: "attended", userId: "me" },
    ];
    const { items } = scoreEvents({
      userId: "me",
      events,
      allRsvps,
      myRsvps: [{ eventId: "attended" }],
      myGroupCount: 0,
      now: NOW,
    });
    expect(items[0].eventId).toBe("viral");
  });

  it("labels events with no signal as popular and reports not personalized", () => {
    const { items, personalized } = scoreEvents({
      userId: "newbie",
      events: [{ eventId: "x", ownerId: "o", startsAt: future(7) }],
      allRsvps: [],
      myRsvps: [],
      myGroupCount: 0,
      now: NOW,
    });
    expect(personalized).toBe(false);
    expect(items[0].reasons).toContain("Popular on campus");
  });

  it("caps the result at 8 items", () => {
    const events = Array.from({ length: 20 }, (_, i) => ({
      eventId: `e${i}`,
      ownerId: "o",
      startsAt: future(i + 1),
    }));
    const { items } = scoreEvents({
      userId: "me",
      events,
      allRsvps: [],
      myRsvps: [],
      myGroupCount: 0,
      now: NOW,
    });
    expect(items).toHaveLength(8);
  });
});
