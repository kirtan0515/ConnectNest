import React from "react";
import CreateEvent from "../../components/events/CreateEvent";
import EventFeed from "./EventFeed";
import "./Events.css";

const Events = () => {
  return (
    <div className="events-page">
      <div className="events-page__header">
        <h1>Events</h1>
        <p>Discover and create campus events</p>
      </div>

      <div className="events-page__grid">
        <div className="events-page__create">
          <CreateEvent />
        </div>
        <div className="events-page__feed">
          <div className="card" style={{ padding: 20 }}>
            <h2 className="section-title">📡 Upcoming Events</h2>
            <EventFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
