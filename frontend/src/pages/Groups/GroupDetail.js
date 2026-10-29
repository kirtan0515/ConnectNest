import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../api/client";
import {
  getGroup,
  listGroupMembers,
  joinGroup,
} from "../../services/groupServices";
import Posts from "../../components/post/Post";
import Share from "../../components/share/Share";
import "./GroupDetail.css";

const GroupDetail = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [groupPosts, setGroupPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [grp, mem, posts] = await Promise.all([
        getGroup(groupId),
        listGroupMembers(groupId),
        api.get(`/posts?groupId=${groupId}`),
      ]);
      setGroup(grp);
      setMembers(mem?.items ?? []);
      setGroupPosts(posts?.items ?? []);
    } catch (err) {
      setError(err.message || "Could not load this group.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const isMember = members.some((m) => m.userId === user?.userId);

  const handleJoin = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await joinGroup(groupId);
      await load();
    } catch (err) {
      setError(err.message || "Could not join this group.");
    } finally {
      setBusy(false);
    }
  };

  if (loading)
    return (
      <div className="group-detail">
        <p className="gd-muted">Loading…</p>
      </div>
    );
  if (!group)
    return (
      <div className="group-detail">
        <p className="gd-muted">{error || "Group not found."}</p>
      </div>
    );

  const memberCount = group.memberCount || members.length;

  return (
    <div className="group-detail">
      <button className="gd-back" onClick={() => navigate("/groups")}>
        ← Back to groups
      </button>

      <div className="gd-card card">
        <div className="gd-header">
          <div className="gd-icon">{(group.name || "?")[0].toUpperCase()}</div>
          <div>
            <h1 className="gd-title">{group.name}</h1>
            <p className="gd-count">
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </p>
          </div>
        </div>

        {group.description && <p className="gd-desc">{group.description}</p>}

        {error && (
          <p className="cn-alert cn-alert--error" role="alert">
            {error}
          </p>
        )}

        {!isMember && (
          <div className="gd-actions">
            <button className="btn-primary" onClick={handleJoin} disabled={busy}>
              {busy ? "…" : "Join group"}
            </button>
          </div>
        )}
      </div>

      <div className="gd-members card">
        <h2 className="gd-section-title">Members ({members.length})</h2>
        {members.length === 0 ? (
          <p className="gd-muted">No members yet.</p>
        ) : (
          <ul className="gd-member-list">
            {members.map((m) => {
              const name = m.userName || "Student";
              const initials = name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <li key={m.userId} className="gd-member">
                  <span className="gd-member__avatar">{initials}</span>
                  <span>
                    {name}
                    {m.userId === user?.userId ? " (you)" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isMember ? (
        <Share groupId={groupId} onPosted={load} />
      ) : (
        <div className="gd-join-prompt card">
          <p>Join this group to post.</p>
        </div>
      )}

      <Posts posts={groupPosts} />
    </div>
  );
};

export default GroupDetail;
