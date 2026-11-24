import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { rsvpToEvent, cancelRsvp, listAttendees } from "../../services/eventServices";
import { parseStartsAt, hasTime, isPastDay, toDateKey } from "./calendarUtils";

export const formatWhen = (event) => {
  const d = parseStartsAt(event.startsAt);
  if (!d) return "Date to be announced";
  const day = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return hasTime(event.startsAt)
    ? `${day}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
    : day;
};

/** Event summary with RSVP (going / interested) and cancel. */
const RsvpPanel = ({ event, onChanged }) => {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const d = parseStartsAt(event.startsAt);
  const isPast = !!d && (hasTime(event.startsAt) ? d.getTime() < Date.now() : isPastDay(toDateKey(d)));

  const load = useCallback(async () => {
    try {
      const res = await listAttendees(event.eventId);
      setAttendees(res?.items ?? []);
    } catch (err) {
      setError(err.message || "Could not load RSVPs.");
    }
  }, [event.eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const mine = attendees.find((a) => a.userId === user?.userId);
  const myStatus = mine ? mine.status || "going" : null;

  const act = async (fn) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
      if (onChanged) onChanged();
    } catch (err) {
      setError(err.message || "Could not update your RSVP.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ecal-rsvp">
      <p className="ecal-rsvp__meta">
        <CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" />
        {formatWhen(event)}
      </p>
      {event.location && (
        <p className="ecal-rsvp__meta">
          <MapPin size={16} strokeWidth={1.75} aria-hidden="true" />
          {event.location}
        </p>
      )}
      <p className="ecal-rsvp__meta">
        <Users size={16} strokeWidth={1.75} aria-hidden="true" />
        {attendees.length} {attendees.length === 1 ? "person" : "people"} responded
      </p>
      {event.description && <p className="ecal-rsvp__desc">{event.description}</p>}

      {isPast ? (
        <p className="ecal-note">This event has already happened.</p>
      ) : (
        <div className="ecal-rsvp__actions" role="group" aria-label="Your RSVP">
          <button
            type="button"
            className="ecal-btn ecal-btn--fill"
            aria-pressed={myStatus === "going"}
            disabled={busy || myStatus === "going"}
            onClick={() => act(() => rsvpToEvent(event.eventId, "going"))}
          >
            {myStatus === "going" ? "You're going" : "Going"}
          </button>
          <button
            type="button"
            className="ecal-btn ecal-btn--line"
            aria-pressed={myStatus === "interested"}
            disabled={busy || myStatus === "interested"}
            onClick={() => act(() => rsvpToEvent(event.eventId, "interested"))}
          >
            {myStatus === "interested" ? "Marked interested" : "Interested"}
          </button>
          {myStatus && (
            <button
              type="button"
              className="ecal-btn ecal-btn--text"
              disabled={busy}
              onClick={() => act(() => cancelRsvp(event.eventId))}
            >
              Cancel RSVP
            </button>
          )}
        </div>
      )}
      <div className="ecal-sr-live" role="status" aria-live="polite">
        {myStatus ? `Your RSVP: ${myStatus}` : ""}
      </div>
      {error && <p className="ecal-error" role="alert">{error}</p>}
      <Link className="ecal-link" to={`/events/${event.eventId}`}>
        View full event page
      </Link>
    </div>
  );
};

export default RsvpPanel;
