import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { getActivity } from "../../services/activityServices";
import Posts from "../../components/post/Post";
import "./Activity.css";

const Activity = () => {
  const navigate = useNavigate();
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [activeGroups, setActiveGroups] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await getActivity();
      setRecentEvents(data.recentEvents);
      setRecentPosts(data.recentPosts);
      setActiveGroups(data.activeGroups);
    } catch (err) {
      console.error("Error fetching activity:", err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEvent = (eventId) => navigate(`/events/${eventId}`);
  const openGroup = (groupId) => navigate(`/groups/${groupId}`);
  const onKeyActivate = (e, fn) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  return (
    <div className="activity">
      <h1 className="activity__title">Campus Activity</h1>

      {/* Upcoming Events */}
      <section className="activity__section">
        <h2 className="activity__heading">Upcoming Events</h2>
        {recentEvents.length === 0 ? (
          <p className="activity__empty">No upcoming events yet. Check back soon.</p>
        ) : (
          <div className="activity__events">
            {recentEvents.map((event) => (
              <div
                key={event.eventId}
                className="activity-event card"
                role="button"
                tabIndex={0}
                onClick={() => openEvent(event.eventId)}
                onKeyDown={(e) => onKeyActivate(e, () => openEvent(event.eventId))}
              >
                <div className="activity-event__date">
                  <span className="activity-event__month">
                    {event.startsAt
                      ? new Date(event.startsAt).toLocaleDateString("en-US", {
                          month: "short",
                        })
                      : "—"}
                  </span>
                  <span className="activity-event__day">
                    {event.startsAt ? new Date(event.startsAt).getDate() : ""}
                  </span>
                </div>
                <div className="activity-event__info">
                  <div className="activity-event__name">{event.title}</div>
                  {event.description && (
                    <div className="activity-event__desc">{event.description}</div>
                  )}
                  <div className="activity-event__meta">
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
        )}
      </section>

      <div className="divider activity__divider" />

      {/* Latest Posts */}
      <section className="activity__section">
        <h2 className="activity__heading">Latest Posts</h2>
        <Posts posts={recentPosts} />
      </section>

      <div className="divider activity__divider" />

      {/* Active Groups */}
      <section className="activity__section">
        <h2 className="activity__heading">Active Groups</h2>
        {activeGroups.length === 0 ? (
          <p className="activity__empty">No groups yet. Start one and bring people together.</p>
        ) : (
          <div className="activity__groups">
            {activeGroups.map((group) => (
              <div
                key={group.groupId}
                className="activity-group card"
                role="button"
                tabIndex={0}
                onClick={() => openGroup(group.groupId)}
                onKeyDown={(e) => onKeyActivate(e, () => openGroup(group.groupId))}
              >
                <div className="activity-group__icon">
                  {group.name ? group.name[0].toUpperCase() : "?"}
                </div>
                <div className="activity-group__info">
                  <div className="activity-group__name">{group.name}</div>
                  {group.description && (
                    <div className="activity-group__desc">{group.description}</div>
                  )}
                  <div className="activity-group__meta">
                    {group.memberCount || 0} members
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Activity;
