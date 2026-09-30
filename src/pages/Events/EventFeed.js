import React, { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/api";
import { onCreateEvent } from "../../graphql/subscriptions";
import { listEvents } from "../../graphql/queries";
import { getCurrentUser } from "aws-amplify/auth";
import { updateEvent } from "../../graphql/mutations";
import "./EventFeed.css";

const client = generateClient();

const EventFeed = ({ compact = false }) => {
  const [events, setEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user?.username);
        const response = await client.graphql({ query: listEvents });
        const items = response?.data?.listEvents?.items || [];
        const upcoming = items
          .filter((e) => new Date(e.date) >= new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(upcoming);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };
    init();

    let sub;
    try {
      sub = client.graphql({ query: onCreateEvent }).subscribe({
        next: ({ value }) => {
          const e = value?.data?.onCreateEvent;
          if (e && new Date(e.date) >= new Date()) {
            setEvents((prev) =>
              [e, ...prev].sort((a, b) => new Date(a.date) - new Date(b.date))
            );
          }
        },
        error: (err) => console.error("Subscription error:", err),
      });
    } catch {}

    return () => sub?.unsubscribe();
  }, []);

  const handleRSVP = async (event) => {
    if (!currentUser || event.attendees?.includes(currentUser)) return;
    try {
      const updated = { id: event.id, attendees: [...(event.attendees || []), currentUser] };
      await client.graphql({ query: updateEvent, variables: { input: updated } });
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, attendees: updated.attendees } : e))
      );
    } catch (err) {
      console.error("RSVP failed:", err);
    }
  };

  if (events.length === 0) {
    return <p className="ef-empty">No upcoming events yet.</p>;
  }

  return (
    <div className={`ef-list${compact ? " ef-list--compact" : ""}`}>
      {events.map((event) => {
        const rsvped = event.attendees?.includes(currentUser);
        return (
          <div key={event.id} className="ef-card card">
            <div className="ef-card__date-badge">
              <span className="ef-card__month">
                {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
              </span>
              <span className="ef-card__day">
                {new Date(event.date).getDate()}
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
                <span>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                  {event.attendees?.length || 0} going
                </span>
              </div>
            </div>
            <div className="ef-card__action">
              {rsvped
                ? <span className="ef-rsvped">✓ Going</span>
                : <button className="btn-outline ef-rsvp-btn" onClick={() => handleRSVP(event)}>RSVP</button>
              }
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EventFeed;
