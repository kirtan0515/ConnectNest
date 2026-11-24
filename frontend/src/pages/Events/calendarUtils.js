// Date helpers for the Events calendar. All placement is by the viewer's local
// calendar day. Date-only strings ("2025-03-05") are read as that local day
// rather than UTC midnight, which would shift them a day in western zones.
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n) => String(n).padStart(2, "0");

/** Local "YYYY-MM-DD" key for a Date. */
export const toDateKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Parse a "YYYY-MM-DD" key into a local Date at midnight. */
export const fromDateKey = (key) => {
  const m = DATE_ONLY.exec(key);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

/** Parse an event's startsAt into a Date, or null when missing/invalid. */
export const parseStartsAt = (startsAt) => {
  if (!startsAt) return null;
  if (DATE_ONLY.test(startsAt)) return fromDateKey(startsAt);
  const d = new Date(startsAt);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** True when startsAt carries a time of day (not a bare date). */
export const hasTime = (startsAt) => !!startsAt && !DATE_ONLY.test(startsAt);

/** Local day key for an event, or null when it has no usable start date. */
export const eventDateKey = (event) => {
  const d = parseStartsAt(event?.startsAt);
  return d ? toDateKey(d) : null;
};

/** Split events into { byDay: {key: event[]}, undated: event[] }, sorted by start. */
export const groupEventsByDay = (events) => {
  const byDay = {};
  const undated = [];
  for (const ev of events || []) {
    const key = eventDateKey(ev);
    if (!key) undated.push(ev);
    else (byDay[key] = byDay[key] || []).push(ev);
  }
  const start = (e) => parseStartsAt(e.startsAt).getTime();
  Object.values(byDay).forEach((list) => list.sort((a, b) => start(a) - start(b)));
  return { byDay, undated };
};

/**
 * Weeks (Sunday first) covering a month, as arrays of 7 cells:
 * { key, date, inMonth }. Only the weeks the month needs are returned.
 */
export const buildMonthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = first.getDay();
  const weekCount = Math.ceil((lead + daysInMonth) / 7);
  const weeks = [];
  for (let w = 0; w < weekCount; w++) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(year, month, 1 - lead + w * 7 + i);
      week.push({ key: toDateKey(date), date, inMonth: date.getMonth() === month });
    }
    weeks.push(week);
  }
  return weeks;
};

/** True when the day key is before today (today itself is not past). */
export const isPastDay = (key, now = new Date()) => key < toDateKey(now);

/** Move a day key by a number of days. */
export const addDays = (key, n) => {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
};

/** Move a day key by whole months, clamping the day to the target month's length. */
export const addMonths = (key, n) => {
  const d = fromDateKey(key);
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, last));
  return toDateKey(target);
};

/** ISO string for a local date key + "HH:MM" time. */
export const toStartsAtIso = (key, time = "18:00") => {
  const d = fromDateKey(key);
  const [h, m] = (time || "00:00").split(":").map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
};
