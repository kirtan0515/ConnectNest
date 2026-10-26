import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { api } from "../../api/client";
import { useRealtime } from "../../realtime/useRealtime";
import AuthImage from "../../components/common/AuthImage";
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

  // Live inserts; the 15s poll above stays as an idempotent reconciliation
  // backstop. De-dupe by eventId, keep the upcoming filter + startsAt sort.
  useRealtime("event.created", (item) =>
    setEvents((prev) => {
      if (prev.some((e) => e.eventId === item.eventId)) return prev;
      const next = [...prev, item].filter(
        (e) => !e.startsAt || new Date(e.startsAt) >= new Date()
      );
      next.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
      return next;
    })
  );

  if (events.length === 0) {
    return <p className="ef-empty">No upcoming events yet. Check back soon.</p>;
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
          {event.imageKey && (
            <AuthImage
              imageKey={event.imageKey}
              alt={event.title}
              className="ef-card__image"
            />
          )}
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
                  <MapPin size={13} strokeWidth={1.75} aria-hidden="true" />
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
