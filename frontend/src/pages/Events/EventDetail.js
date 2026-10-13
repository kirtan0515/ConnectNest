import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  getEvent,
  deleteEvent,
  rsvpToEvent,
  cancelRsvp,
  listAttendees,
} from "../../services/eventServices";
import AuthImage from "../../components/common/AuthImage";
import "./EventDetail.css";

const EventDetail = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [ev, rsvps] = await Promise.all([
        getEvent(eventId),
        listAttendees(eventId),
      ]);
      setEvent(ev);
      setAttendees(rsvps?.items ?? []);
    } catch (err) {
      setError(err.message || "Could not load this event.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const isGoing = attendees.some((a) => a.userId === user?.userId);
  const isOwner = event && event.ownerId === user?.userId;

  const toggleRsvp = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (isGoing) await cancelRsvp(eventId);
      else await rsvpToEvent(eventId, "going");
      await load();
    } catch (err) {
      setError(err.message || "Could not update your RSVP.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await deleteEvent(eventId);
      navigate("/events");
    } catch (err) {
      setError(err.message || "Could not delete this event.");
    }
  };

  if (loading) return <div className="event-detail"><p className="ed-muted">Loading…</p></div>;
  if (!event) return <div className="event-detail"><p className="ed-muted">{error || "Event not found."}</p></div>;

  const date = event.startsAt ? new Date(event.startsAt) : null;

  return (
    <div className="event-detail">
      <button className="ed-back" onClick={() => navigate("/events")}>← Back to events</button>

      <div className="ed-card card">
        {event.imageKey && (
          <AuthImage
            imageKey={event.imageKey}
            alt={event.title}
            className="ed-image"
          />
        )}
        <div className="ed-header">
          {date && (
            <div className="ed-date">
              <span className="ed-date__month">
                {date.toLocaleDateString("en-US", { month: "short" })}
              </span>
              <span className="ed-date__day">{date.getDate()}</span>
            </div>
          )}
          <div>
            <h1 className="ed-title">{event.title}</h1>
            {event.ownerName && <p className="ed-owner">Hosted by {event.ownerName}</p>}
          </div>
        </div>

        {event.description && <p className="ed-desc">{event.description}</p>}

        <div className="ed-meta">
          {event.location && (
            <span className="ed-meta__item">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
              {event.location}
            </span>
          )}
          {date && (
            <span className="ed-meta__item">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V9h14z"/></svg>
              {date.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <span className="ed-meta__item">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            {attendees.length} {attendees.length === 1 ? "person" : "people"} going
          </span>
        </div>

        {error && <p className="cn-alert cn-alert--error" role="alert">{error}</p>}

        <div className="ed-actions">
          <button
            className={`ed-rsvp${isGoing ? " ed-rsvp--going" : ""}`}
            onClick={toggleRsvp}
            disabled={busy}
          >
            {busy ? "…" : isGoing ? "✓ You're going" : "RSVP — I'm going"}
          </button>
          {isOwner && (
            <button className="ed-delete" onClick={handleDelete}>Delete event</button>
          )}
        </div>
      </div>

      {/* Attendees */}
      <div className="ed-attendees card">
        <h2 className="ed-attendees__title">Who's going ({attendees.length})</h2>
        {attendees.length === 0 ? (
          <p className="ed-muted">No one has RSVP'd yet. Be the first!</p>
        ) : (
          <ul className="ed-attendee-list">
            {attendees.map((a) => {
              const name = a.userName || "Student";
              const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
              return (
                <li key={a.userId} className="ed-attendee">
                  <span className="ed-attendee__avatar">{initials}</span>
                  <span>{name}{a.userId === user?.userId ? " (you)" : ""}</span>
                  {a.status === "interested" && <span className="ed-attendee__tag">interested</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EventDetail;
