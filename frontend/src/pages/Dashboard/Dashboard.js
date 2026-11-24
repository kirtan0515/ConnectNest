import React from "react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { CalendarPlus, CalendarDays, UsersRound, Upload, Zap } from "lucide-react";
import Share from "../../components/share/Share";
import Posts from "../../components/post/Post";
import EventFeed from "../Events/EventFeed";
import MyGroups from "../../components/dashboard/MyGroups";
import Recommendations from "../../components/dashboard/Recommendations";
import CampusNetwork from "../../components/dashboard/CampusNetwork";
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
      {/* HERO — the page's only <h1> lives inside CampusNetwork */}
      <section className="cn-hero" aria-label="Your campus network">
        <CampusNetwork />
      </section>

      {/* IDENTITY (top row, beside the hero) */}
      <section className="cn-identity" aria-labelledby="cn-identity-title">
        <div className="card profile-card">
          <h2 id="cn-identity-title" className="sr-only-visually section-title" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
            Your profile
          </h2>
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
      </section>

      {/* COMPOSER */}
      <section className="cn-composer" aria-label="Share an update">
        <Share />
      </section>

      {/* FEED */}
      <section className="cn-feed" aria-label="Campus feed">
        <Posts />
      </section>

      {/* RAIL — single sticky wrapper holding groups / events / quick actions.
          On phone it becomes display:contents so these three reflow into the
          single column (REQUIRED FIX 2). */}
      <div className="cn-rail">
        <section className="cn-groups">
          <MyGroups />
        </section>

        <section className="cn-recommendations">
          <Recommendations />
        </section>

        <section className="cn-events card sidebar-section" id="cn-events" tabIndex={-1} aria-labelledby="cn-events-title">
          <h2 id="cn-events-title" className="section-title section-title--glyph">
            <span className="section-icon section-icon--coral" aria-hidden="true">
              <CalendarDays strokeWidth={1.75} />
            </span>
            Upcoming Events
          </h2>
          <EventFeed compact />
        </section>

        <section className="cn-actions card quick-actions" aria-labelledby="cn-actions-title">
          <h2 id="cn-actions-title" className="section-title section-title--glyph">
            <span className="section-icon section-icon--lilac" aria-hidden="true">
              <Zap strokeWidth={1.75} />
            </span>
            Quick Actions
          </h2>
          <button className="quick-action-btn" onClick={() => navigate("/events")}>
            <span className="quick-action-btn__icon quick-action-btn__icon--coral" aria-hidden="true"><CalendarPlus strokeWidth={1.75} /></span>
            Create Event
          </button>
          <button className="quick-action-btn" onClick={() => navigate("/groups")}>
            <span className="quick-action-btn__icon quick-action-btn__icon--sky" aria-hidden="true"><UsersRound strokeWidth={1.75} /></span>
            Create Group
          </button>
          <button className="quick-action-btn" onClick={() => navigate("/files")}>
            <span className="quick-action-btn__icon quick-action-btn__icon--lime" aria-hidden="true"><Upload strokeWidth={1.75} /></span>
            Upload File
          </button>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
