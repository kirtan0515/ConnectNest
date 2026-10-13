import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import "./MyGroups.css";

/**
 * Shows recent groups. A dedicated "my memberships" endpoint (GroupMembers
 * byUser GSI) is a planned follow-up; for now this lists available groups.
 */
const MyGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/groups");
        setGroups((res?.items || []).slice(0, 5));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <div className="my-groups card">
      <div className="my-groups__header">
        <h4 className="section-title" style={{ margin: 0 }}>Groups</h4>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate("/groups")}>
          See all
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="my-groups__empty">No groups yet.</p>
      ) : (
        <ul className="my-groups__list">
          {groups.map((g) => (
            <li key={g.groupId} className="my-groups__item" onClick={() => navigate("/groups")}>
              <div className="my-groups__icon">{g.name[0].toUpperCase()}</div>
              <span>{g.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyGroups;
