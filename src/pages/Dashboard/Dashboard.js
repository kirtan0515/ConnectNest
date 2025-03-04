import React, { useEffect, useState } from "react";
import { GraphQLAPI, graphqlOperation } from "@aws-amplify/api-graphql";
import { listEvents } from "../../graphql/queries";
import { createEvent } from "../../graphql/mutations";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { EventCreateForm } from "../../ui-components"; // Adjust import if needed
import Feed from "./Feed"; // Adjust import if needed
import "./Dashboard.css"; // Import the CSS file

export default function Dashboard() {
  const { user, signOut } = useAuthenticator((context) => [context.user, context.signOut]);

  // Event state
  const [events, setEvents] = useState([]);
  // Simple "post" content state (for the "Post Composer")
  const [postContent, setPostContent] = useState("");

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEvents() {
    try {
      const response = await GraphQLAPI.graphql(graphqlOperation(listEvents));
      setEvents(response.data.listEvents.items);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }

  async function handleCreateEvent(eventData) {
    try {
      await GraphQLAPI.graphql(graphqlOperation(createEvent, { input: eventData }));
      fetchEvents(); // Refresh events list
    } catch (error) {
      console.error("Error creating event:", error);
    }
  }

  // Basic "post" submission example
  function handlePostSubmit() {
    console.log("Post submitted:", postContent);
    setPostContent("");
  }

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <nav className="dashboard-navbar">
        <div className="navbar-left">
          <h1 className="brand">ConnectNest</h1>
        </div>
        <div className="navbar-right">
          <p className="welcome">
            Welcome, <span className="username">{user?.username}</span>
          </p>
          <button onClick={signOut} className="signout-button">
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main 3-Column Layout */}
      <div className="dashboard-layout">
        {/* Left Sidebar */}
        <aside className="sidebar-left">
          <div className="cover-photo">
            <img
              src="https://via.placeholder.com/300x100.png?text=Cover+Photo"
              alt="Cover"
            />
          </div>
          <div className="profile-section">
            <img
              src="https://via.placeholder.com/80.png?text=Avatar"
              alt="Avatar"
              className="profile-avatar"
            />
            <h3>{user?.username}</h3>
            <p className="profile-subtitle">Student at XYZ University</p>
          </div>
          <hr />
          <div className="shortcut-list">
            <h4>Your Shortcuts</h4>
            <ul>
              <li>My Groups</li>
              <li>My Courses</li>
              <li>Campus Map</li>
            </ul>
          </div>
        </aside>

        {/* Center (Main) Column */}
        <main className="main-content">
          {/* Post Composer */}
          <div className="post-composer">
            <div className="composer-top">
              <img
                src="https://via.placeholder.com/40.png?text=U"
                alt="User"
                className="composer-avatar"
              />
              <input
                type="text"
                placeholder="What's on your mind?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
            </div>
            <div className="composer-bottom">
              <button onClick={handlePostSubmit}>Post</button>
            </div>
          </div>

          {/* Feed Section */}
          <div className="feed-section">
            <h2>News Feed</h2>
            <Feed events={events} />
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="sidebar-right">
          <h2>Upcoming Events</h2>
          <div className="events-list">
            {events.map((event) => (
              <div key={event.id} className="event-item">
                <h3>{event.title}</h3>
                <p>{event.date}</p>
              </div>
            ))}
          </div>

          <h3>Create an Event</h3>
          <EventCreateForm onSubmit={(data) => handleCreateEvent(data)} />
        </aside>
      </div>
    </div>
  );
}
