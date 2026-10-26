import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listMyGroups } from "../../services/groupServices";
import ConnectorGlyph from "./ConnectorGlyph";
import "./MyGroups.css";

/** Shows the groups the current user belongs to (GET /me/groups). */
const MyGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const items = await listMyGroups();
        setGroups(items.slice(0, 5));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <div className="my-groups card">
      <div className="my-groups__header">
        <h2 className="section-title section-title--glyph" style={{ margin: 0 }}>
          <ConnectorGlyph />
          Groups
        </h2>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate("/groups")}>
          See all
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="my-groups__empty">
          <ConnectorGlyph size={28} className="my-groups__empty-glyph" />
          <p>No groups yet — join one to grow your network.</p>
        </div>
      ) : (
        <ul className="my-groups__list">
          {groups.map((g, i) => (
            <li key={g.groupId} className="my-groups__item" onClick={() => navigate("/groups")}>
              <div
                className="my-groups__icon"
                style={{ background: `var(--group-${(i % 4) + 1})` }}
              >
                {(g.name || "?").charAt(0).toUpperCase()}
              </div>
              <span>{g.name || "Untitled group"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyGroups;
