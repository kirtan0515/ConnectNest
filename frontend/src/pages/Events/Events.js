import React, { useCallback, useEffect, useState } from "react";
import EventCalendar from "./EventCalendar";
import EventFeed from "./EventFeed";
import { getEvents } from "../../services/eventServices";
import { useRealtime } from "../../realtime/useRealtime";
import "./Events.css";
const Events = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setEvents(await getEvents());
      setError("");
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Could not load events. Try again in a moment.");
    }
  }, []);
  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);
  useRealtime("event.created", load);
  return (
    <div className="events-page">
      <div className="events-page__header">
        <h1>Events</h1>
        <p>Pick a date to add an event, or select an event to RSVP</p>
      </div>
      {error && <div className="event-form__error" role="alert">{error}</div>}
      <div className="events-page__grid">
        <div className="events-page__calendar card">
          <EventCalendar events={events} onChanged={load} />
        </div>
        <div className="events-page__feed">
          <div className="card" style={{ padding: 20 }}>
            <h2 className="section-title">Upcoming Events</h2>
            <EventFeed compact />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Events;
