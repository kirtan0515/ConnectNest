import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import "./EventFeed.css";

const EventFeed = ({ compact = false }) => {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const res = await api.get("/events");
      const items = res?.items || [];
      const upcoming = items
        .filter((e) => !e.startsAt || new Date(e.startsAt) >= new Date())
        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
      setEvents(upcoming);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  }, []);

  useEffect(() => {
    load();
    // Poll for near-real-time updates (replaces GraphQL subscriptions).
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  if (events.length === 0) {
    return <p className="ef-empty">No upcoming events yet.</p>;
  }

  return (
    <div className={`ef-list${compact ? " ef-list--compact" : ""}`}>
      {events.map((event) => (
        <div
          key={event.eventId}
          className="ef-card card ef-card--link"
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/events/${event.eventId}`)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/events/${event.eventId}`)}
        >
          <div className="ef-card__date-badge">
            <span className="ef-card__month">
              {event.startsAt
                ? new Date(event.startsAt).toLocaleDateString("en-US", { month: "short" })
                : "—"}
            </span>
            <span className="ef-card__day">
              {event.startsAt ? new Date(event.startsAt).getDate() : ""}
            </span>
          </div>
          <div className="ef-card__info">
            <div className="ef-card__title">{event.title}</div>
            {!compact && event.description && (
              <div className="ef-card__desc">{event.description}</div>
            )}
            <div className="ef-card__meta">
              {event.location && (
                <span>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  {event.location}
                </span>
              )}
              {event.ownerName && <span>by {event.ownerName}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventFeed;
