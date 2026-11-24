import { describe, it, expect } from "vitest";
import {
  toDateKey,
  parseStartsAt,
  eventDateKey,
  groupEventsByDay,
  buildMonthGrid,
  isPastDay,
  addDays,
  addMonths,
  toStartsAtIso,
} from "./calendarUtils";

describe("calendarUtils", () => {
  it("reads a date-only string as that local day", () => {
    const d = parseStartsAt("2025-03-05");
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2025, 2, 5]);
    expect(eventDateKey({ startsAt: "2025-03-05" })).toBe("2025-03-05");
  });

  it("places an ISO timestamp on the viewer's local day", () => {
    const iso = new Date(2025, 2, 5, 23, 30).toISOString();
    expect(eventDateKey({ startsAt: iso })).toBe("2025-03-05");
  });

  it("returns null for missing or invalid start dates", () => {
    expect(eventDateKey({})).toBeNull();
    expect(eventDateKey({ startsAt: "nope" })).toBeNull();
  });

  it("groups events by day, sorted by time, with undated ones apart", () => {
    const late = { eventId: "a", startsAt: new Date(2025, 2, 5, 20).toISOString() };
    const early = { eventId: "b", startsAt: new Date(2025, 2, 5, 9).toISOString() };
    const none = { eventId: "c" };
    const { byDay, undated } = groupEventsByDay([late, early, none]);
    expect(byDay["2025-03-05"].map((e) => e.eventId)).toEqual(["b", "a"]);
    expect(undated).toEqual([none]);
  });

  it("builds only the weeks a month needs, Sunday first", () => {
    const feb2026 = buildMonthGrid(2026, 1); // Feb 2026 starts on Sunday, 28 days
    expect(feb2026).toHaveLength(4);
    expect(feb2026[0][0].key).toBe("2026-02-01");
    const mar2025 = buildMonthGrid(2025, 2); // starts on Saturday
    expect(mar2025).toHaveLength(6);
    expect(mar2025[0][0]).toMatchObject({ key: "2025-02-23", inMonth: false });
    expect(mar2025[0][6]).toMatchObject({ key: "2025-03-01", inMonth: true });
    expect(mar2025.every((w) => w.length === 7)).toBe(true);
  });

  it("treats today as not past and yesterday as past", () => {
    const now = new Date(2025, 2, 5, 15);
    expect(isPastDay("2025-03-05", now)).toBe(false);
    expect(isPastDay("2025-03-04", now)).toBe(true);
  });

  it("moves by days and months across boundaries", () => {
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01");
    expect(addDays("2025-01-01", -1)).toBe("2024-12-31");
    expect(addMonths("2025-01-31", 1)).toBe("2025-02-28");
    expect(addMonths("2025-01-15", -1)).toBe("2024-12-15");
  });

  it("builds a start timestamp that round-trips to the chosen local day", () => {
    const iso = toStartsAtIso("2025-03-05", "18:30");
    const d = new Date(iso);
    expect(toDateKey(d)).toBe("2025-03-05");
    expect([d.getHours(), d.getMinutes()]).toEqual([18, 30]);
  });
});
