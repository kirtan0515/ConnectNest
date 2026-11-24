import React, { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import CreateEvent from "../../components/events/CreateEvent";
import EventDialog from "./EventDialog";
import RsvpPanel, { formatWhen } from "./RsvpPanel";
import {
  addDays,
  addMonths,
  buildMonthGrid,
  fromDateKey,
  groupEventsByDay,
  hasTime,
  isPastDay,
  parseStartsAt,
  toDateKey,
} from "./calendarUtils";
import "./EventCalendar.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_CHIPS = 2;

const timeLabel = (event) =>
  hasTime(event.startsAt)
    ? parseStartsAt(event.startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

const EventCalendar = ({ events, onChanged }) => {
  const todayKey = toDateKey(new Date());
  const [focusKey, setFocusKey] = useState(todayKey);
  const [dialog, setDialog] = useState(null); // { type: "event", event } | { type: "day", key }
  const gridRef = useRef(null);

  const focusDate = fromDateKey(focusKey);
  const year = focusDate.getFullYear();
  const month = focusDate.getMonth();
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const { byDay, undated } = useMemo(() => groupEventsByDay(events), [events]);

  const monthLabel = focusDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const moveFocus = (key, { keepFocus = true } = {}) => {
    setFocusKey(key);
    if (keepFocus) {
      requestAnimationFrame(() => {
        gridRef.current?.querySelector(`[data-date="${key}"]`)?.focus();
      });
    }
  };

  const onGridKeyDown = (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (step) {
      e.preventDefault();
      moveFocus(addDays(focusKey, step));
    } else if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      moveFocus(addMonths(focusKey, e.key === "PageUp" ? -1 : 1));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const dow = focusDate.getDay();
      moveFocus(addDays(focusKey, e.key === "Home" ? -dow : 6 - dow));
    }
  };

  const openDay = (key) => {
    setFocusKey(key);
    setDialog({ type: "day", key });
  };

  const closeDialog = () => setDialog(null);

  const handleCreated = () => {
    if (onChanged) onChanged();
    setDialog(null);
  };

  const dayLabel = (key) =>
    fromDateKey(key).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <section className="ecal" aria-label="Events calendar">
      <div className="ecal__bar">
        <h2 className="ecal__month" aria-live="polite">{monthLabel}</h2>
        <div className="ecal__nav">
          <button
            type="button"
            className="ecal-btn ecal-btn--fill ecal__new"
            onClick={() => openDay(todayKey)}
          >
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            New event
          </button>
          <button
            type="button"
            className="ecal-btn ecal-btn--line ecal__today"
            onClick={() => setFocusKey(todayKey)}
          >
            Today
          </button>
          <button
            type="button"
            className="ecal-icon-btn"
            aria-label="Previous month"
            onClick={() => setFocusKey(addMonths(focusKey, -1))}
          >
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="ecal-icon-btn"
            aria-label="Next month"
            onClick={() => setFocusKey(addMonths(focusKey, 1))}
          >
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="ecal__grid"
        role="grid"
        aria-label={monthLabel}
        ref={gridRef}
        onKeyDown={onGridKeyDown}
      >
        <div className="ecal__row ecal__row--head" role="row">
          {WEEKDAYS.map((d) => (
            <div key={d} className="ecal__weekday" role="columnheader">{d}</div>
          ))}
        </div>
        {weeks.map((week) => (
          <div className="ecal__row" role="row" key={week[0].key}>
            {week.map((cell) => {
              const list = byDay[cell.key] || [];
              const past = isPastDay(cell.key);
              const classes = [
                "ecal__cell",
                !cell.inMonth && "ecal__cell--out",
                cell.key === todayKey && "ecal__cell--today",
                past && "ecal__cell--past",
              ].filter(Boolean).join(" ");
              const label =
                `${dayLabel(cell.key)}${cell.key === todayKey ? ", today" : ""}` +
                (list.length ? `, ${list.length} ${list.length === 1 ? "event" : "events"}` : "");
              return (
                <div className={classes} role="gridcell" key={cell.key} aria-selected={cell.key === focusKey}>
                  <button
                    type="button"
                    className="ecal__day"
                    data-date={cell.key}
                    tabIndex={cell.key === focusKey ? 0 : -1}
                    aria-label={label}
                    onClick={() => openDay(cell.key)}
                    onFocus={() => setFocusKey(cell.key)}
                  >
                    <span className="ecal__num">{cell.date.getDate()}</span>
                    {list.length > 0 && (
                      <span className="ecal__dots" aria-hidden="true">
                        {list.slice(0, 3).map((ev) => <i key={ev.eventId} />)}
                      </span>
                    )}
                  </button>
                  <ul className="ecal__chips">
                    {list.slice(0, MAX_CHIPS).map((ev) => (
                      <li key={ev.eventId}>
                        <button
                          type="button"
                          className="ecal__chip"
                          tabIndex={-1}
                          onClick={() => setDialog({ type: "event", event: ev })}
                        >
                          {timeLabel(ev) && <span className="ecal__chip-time">{timeLabel(ev)}</span>}
                          <span className="ecal__chip-title">{ev.title}</span>
                        </button>
                      </li>
                    ))}
                    {list.length > MAX_CHIPS && (
                      <li className="ecal__more" aria-hidden="true">+{list.length - MAX_CHIPS} more</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="ecal__hint">
        Select a date to see its events or add one. Arrow keys move between days, Page Up and Page Down change month.
      </p>

      {undated.length > 0 && (
        <div className="ecal__undated">
          <h3 className="ecal__undated-title">Date to be announced</h3>
          <ul>
            {undated.map((ev) => (
              <li key={ev.eventId}>
                <button
                  type="button"
                  className="ecal-btn ecal-btn--line"
                  onClick={() => setDialog({ type: "event", event: ev })}
                >
                  {ev.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dialog?.type === "event" && (
        <EventDialog title={dialog.event.title} titleId="ecal-event-title" onClose={closeDialog}>
          <RsvpPanel event={dialog.event} onChanged={onChanged} />
        </EventDialog>
      )}

      {dialog?.type === "day" && (
        <EventDialog title={dayLabel(dialog.key)} titleId="ecal-day-title" onClose={closeDialog}>
          {(byDay[dialog.key] || []).length > 0 && (
            <ul className="ecal-daylist">
              {byDay[dialog.key].map((ev) => (
                <li key={ev.eventId}>
                  <button
                    type="button"
                    className="ecal-daylist__item"
                    onClick={() => setDialog({ type: "event", event: ev })}
                  >
                    <span className="ecal-daylist__title">{ev.title}</span>
                    <span className="ecal-daylist__meta">{formatWhen(ev)}{ev.location ? `, ${ev.location}` : ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {isPastDay(dialog.key) ? (
            <p className="ecal-note">
              {(byDay[dialog.key] || []).length === 0 ? "No events on this day. " : ""}
              Events can only be created for today or later.
            </p>
          ) : (
            <>
              {(byDay[dialog.key] || []).length > 0 && (
                <h3 className="ecal-dialog__sub"><Plus size={16} strokeWidth={1.75} aria-hidden="true" /> Add another event</h3>
              )}
              <CreateEvent
                key={dialog.key}
                initialDate={dialog.key}
                heading={`New event on ${fromDateKey(dialog.key).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                onCreated={handleCreated}
              />
            </>
          )}
        </EventDialog>
      )}
    </section>
  );
};

export default EventCalendar;
