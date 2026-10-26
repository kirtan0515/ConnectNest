import React from "react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import Share from "../../components/share/Share";
import Posts from "../../components/post/Post";
import EventFeed from "../Events/EventFeed";
import MyGroups from "../../components/dashboard/MyGroups";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName =
    user?.name || (user?.email ? user.email.split("@")[0] : null) || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const pictureUrl = "";

  return (
    <div className="dashboard">
      {/* LEFT */}
      <aside className="dashboard__left">
        <div className="card profile-card">
          <div className="profile-card__banner" />
          <div className="profile-card__body">
            {pictureUrl
              ? <img src={pictureUrl} alt={displayName} className="avatar profile-card__avatar" />
              : <div className="profile-card__initials">{initials}</div>
            }
            <div className="profile-card__name">{displayName}</div>
            <div className="profile-card__sub">{user?.email || ""}</div>
            <button className="btn-outline profile-card__btn" onClick={() => navigate("/profile")}>
              View Profile
            </button>
          </div>
          <div className="divider" style={{ margin: "0 16px" }} />
          <div className="profile-card__stats">
            <div className="profile-card__stat">
              <span className="stat-label">Posts</span>
              <span className="stat-value">—</span>
            </div>
            <div className="profile-card__stat">
              <span className="stat-label">Events</span>
              <span className="stat-value">—</span>
            </div>
          </div>
        </div>

        <MyGroups />

        <div className="card quick-actions">
          <h4 className="section-title">Quick Actions</h4>
          <button className="quick-action-btn" onClick={() => navigate("/events")}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
            Create Event
          </button>
          <button className="quick-action-btn" onClick={() => navigate("/groups")}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            Create Group
          </button>
          <button className="quick-action-btn" onClick={() => navigate("/files")}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
            Upload File
          </button>
        </div>
      </aside>

      {/* CENTER */}
      <div className="dashboard__center">
        <Share />
        <Posts />
      </div>

      {/* RIGHT */}
      <aside className="dashboard__right">
        <div className="card sidebar-section about-card">
          <h4 className="section-title">Welcome to ConnectNest</h4>
          <p className="about-card__lead">
            Your campus, connected — one place for everything happening at
            Harrisburg University.
          </p>
          <ul className="about-card__features">
            <li>Events &amp; RSVP</li>
            <li>Groups &amp; communities</li>
            <li>Posts, likes &amp; comments feed</li>
            <li>File &amp; image sharing</li>
            <li>Secure Cognito login</li>
          </ul>
        </div>

        <div className="card sidebar-section">
          <h4 className="section-title">Upcoming Events</h4>
          <EventFeed compact />
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
