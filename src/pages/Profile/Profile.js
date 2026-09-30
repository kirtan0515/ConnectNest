import React, { useEffect, useState, useRef } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/api";
import { uploadData, getUrl } from "aws-amplify/storage";
import { updateUserAttributes } from "aws-amplify/auth";
import { listPosts, listEvents } from "../../graphql/queries";
import Posts from "../../components/post/Post";
import "./Profile.css";

const client = generateClient();

const Profile = () => {
  const { user } = useAuthenticator();
  const attrs = user?.attributes || {};
  const displayName =
    attrs.name ||
    attrs.preferred_username ||
    (attrs.email ? attrs.email.split("@")[0] : null) ||
    "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const [avatarUrl, setAvatarUrl] = useState(attrs.picture || "");
  const [bio, setBio] = useState(attrs["custom:bio"] || "");
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(bio);
  const [userPosts, setUserPosts] = useState([]);
  const [rsvpEvents, setRsvpEvents] = useState([]);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const fileRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postRes = await client.graphql({
          query: listPosts,
          variables: { filter: { createdBy: { eq: displayName } } },
          authMode: "userPool",
        });
        const posts = postRes?.data?.listPosts?.items || [];
        setUserPosts(posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

        const eventRes = await client.graphql({ query: listEvents, authMode: "userPool" });
        const events = eventRes?.data?.listEvents?.items || [];
        setRsvpEvents(events.filter((e) => e.attendees?.includes(user.username)));
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };
    fetchData();
  }, [user.username, displayName]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const key = `avatars/${user.username}_${Date.now()}.${file.name.split(".").pop()}`;
      await uploadData({ key, data: file }).result;
      const { url } = await getUrl({ key });
      const urlStr = url.toString().split("?")[0]; // strip query params for storage
      await updateUserAttributes({ userAttributes: { picture: urlStr } });
      setAvatarUrl(urlStr);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setAvatarLoading(false);
    }
  };

  const saveBio = async () => {
    try {
      await updateUserAttributes({ userAttributes: { "custom:bio": bioInput } });
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
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} className="profile-cover__avatar" />
              : <div className="profile-cover__initials">{initials}</div>
            }
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
            <p className="profile-cover__email">{attrs.email || ""}</p>

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
              <span className="profile-stat__value">{rsvpEvents.length}</span>
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
          Events ({rsvpEvents.length})
        </button>
      </div>

      {/* Content */}
      <div className="profile-content">
        {activeTab === "posts" && (
          <div className="profile-posts">
            {userPosts.length === 0
              ? <div className="card profile-empty">No posts yet.</div>
              : <Posts filterByUser={displayName} posts={userPosts} />
            }
          </div>
        )}

        {activeTab === "events" && (
          <div className="profile-events">
            {rsvpEvents.length === 0
              ? <div className="card profile-empty">No RSVPs yet.</div>
              : rsvpEvents.map((event) => (
                <div key={event.id} className="card profile-event-card">
                  <div className="profile-event-card__date">
                    <span>{new Date(event.date).toLocaleDateString("en-US", { month: "short" })}</span>
                    <span>{new Date(event.date).getDate()}</span>
                  </div>
                  <div className="profile-event-card__info">
                    <div className="profile-event-card__title">{event.title}</div>
                    <div className="profile-event-card__meta">{event.location}</div>
                  </div>
                  <span className="ef-rsvped">✓ Going</span>
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
