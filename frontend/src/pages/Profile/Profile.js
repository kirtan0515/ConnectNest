import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { api, uploadFile } from "../../api/client";
import { listMyRsvps } from "../../services/eventServices";
import Posts from "../../components/post/Post";
import AuthImage from "../../components/common/AuthImage";
import "./Profile.css";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName =
    user?.name || (user?.email ? user.email.split("@")[0] : null) || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [userPosts, setUserPosts] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const fileRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prof = await api.get("/profiles/me");
        setProfile(prof);
        setBio(prof?.bio || "");
        setBioInput(prof?.bio || "");

        const postRes = await api.get("/posts");
        const posts = (postRes?.items || []).filter(
          (p) => p.authorId === user?.userId
        );
        setUserPosts(
          posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        );

        // Week 6: events the user is attending (RSVP'd), via the byUser GSI.
        const rsvped = await listMyRsvps();
        setMyEvents(rsvped);
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };
    if (user?.userId) fetchData();
  }, [user?.userId]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const avatarKey = await uploadFile(file, "avatars");
      const updated = await api.put("/profiles/me", {
        ...profile,
        avatarKey,
      });
      setProfile(updated);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setAvatarLoading(false);
    }
  };

  const saveBio = async () => {
    try {
      const updated = await api.put("/profiles/me", { ...profile, bio: bioInput });
      setProfile(updated);
      setBio(bioInput);
      setEditingBio(false);
    } catch (err) {
      console.error("Bio update failed:", err);
    }
  };

  return (
    <div className="profile-page">
      {/* Cover + Avatar */}
      <div className="profile-cover card">
        <div className="profile-cover__banner" />
        <div className="profile-cover__body">
          <div className="profile-cover__avatar-wrap">
            {profile?.avatarKey ? (
              <AuthImage
                imageKey={profile.avatarKey}
                alt={displayName}
                className="profile-cover__avatar"
              />
            ) : (
              <div className="profile-cover__initials">{initials}</div>
            )}
            <button
              className="profile-cover__avatar-edit"
              onClick={() => fileRef.current?.click()}
              disabled={avatarLoading}
              title="Change photo"
            >
              {avatarLoading
                ? "…"
                : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
          </div>

          <div className="profile-cover__info">
            <h1 className="profile-cover__name">{displayName}</h1>
            <p className="profile-cover__email">{user?.email || ""}</p>

            {editingBio ? (
              <div className="profile-bio-edit">
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Write a short bio…"
                  rows={2}
                  maxLength={200}
                />
                <div className="profile-bio-edit__actions">
                  <button className="btn-primary" style={{ padding: "6px 16px", fontSize: 13 }} onClick={saveBio}>Save</button>
                  <button className="btn-ghost" onClick={() => { setEditingBio(false); setBioInput(bio); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="profile-bio">
                <p>{bio || <span style={{ color: "var(--text-muted)" }}>Add a bio…</span>}</p>
                <button className="btn-ghost profile-bio__edit-btn" onClick={() => setEditingBio(true)}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="profile-cover__stats">
            <div className="profile-stat">
              <span className="profile-stat__value">{userPosts.length}</span>
              <span className="profile-stat__label">Posts</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat__value">{myEvents.length}</span>
              <span className="profile-stat__label">Events</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs card">
        <button
          className={`profile-tab${activeTab === "posts" ? " active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Posts ({userPosts.length})
        </button>
        <button
          className={`profile-tab${activeTab === "events" ? " active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          Events ({myEvents.length})
        </button>
      </div>

      {/* Content */}
      <div className="profile-content">
        {activeTab === "posts" && (
          <div className="profile-posts">
            {userPosts.length === 0
              ? <div className="card profile-empty">No posts yet.</div>
              : <Posts posts={userPosts} />
            }
          </div>
        )}

        {activeTab === "events" && (
          <div className="profile-events">
            {myEvents.length === 0
              ? <div className="card profile-empty">You haven't RSVP'd to any events yet.</div>
              : myEvents.map((event) => (
                <div
                  key={event.eventId}
                  className="card profile-event-card"
                  role="button"
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/events/${event.eventId}`)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/events/${event.eventId}`)}
                >
                  <div className="profile-event-card__date">
                    <span>{event.startsAt ? new Date(event.startsAt).toLocaleDateString("en-US", { month: "short" }) : "—"}</span>
                    <span>{event.startsAt ? new Date(event.startsAt).getDate() : ""}</span>
                  </div>
                  <div className="profile-event-card__info">
                    <div className="profile-event-card__title">{event.title}</div>
                    <div className="profile-event-card__meta">{event.location}</div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
