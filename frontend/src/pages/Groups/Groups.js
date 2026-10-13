import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { listMyGroups } from "../../services/groupServices";
import "./Groups.css";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [joined, setJoined] = useState(() => new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    try {
      const myGroups = await listMyGroups();
      setJoined(new Set(myGroups.map((g) => g.groupId)));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await api.post("/groups", {
        name: form.name,
        description: form.description,
      });
      setForm({ name: "", description: "" });
      setShowCreate(false);
      fetchGroups();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (group) => {
    if (joined.has(group.groupId)) return;
    try {
      await api.post(`/groups/${group.groupId}/join`, {});
      setJoined((prev) => new Set(prev).add(group.groupId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="groups-page">
      <div className="groups-page__header">
        <div>
          <h1>Groups</h1>
          <p>Join communities and connect with peers</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
          + Create Group
        </button>
      </div>

      {showCreate && (
        <form className="group-create card" onSubmit={handleCreate}>
          <h3>Create a Group</h3>
          <input
            className="group-create__input"
            type="text"
            placeholder="Group name *"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <textarea
            className="group-create__input"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={2}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="groups-grid">
        {groups.length === 0 && (
          <div className="card groups-empty">No groups yet. Create the first one!</div>
        )}
        {groups.map((group) => {
          const isMember = joined.has(group.groupId);
          return (
            <div key={group.groupId} className="group-card card">
              <div className="group-card__icon">{group.name[0].toUpperCase()}</div>
              <div className="group-card__info">
                <div className="group-card__name">{group.name}</div>
                {group.description && (
                  <div className="group-card__desc">{group.description}</div>
                )}
                <div className="group-card__meta">
                  {group.memberCount || 0} members
                </div>
              </div>
              <button
                className={isMember ? "btn-ghost" : "btn-outline"}
                style={{ fontSize: 13, padding: "6px 16px" }}
                onClick={() => !isMember && handleJoin(group)}
                disabled={isMember}
              >
                {isMember ? "Joined" : "Join"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Groups;
