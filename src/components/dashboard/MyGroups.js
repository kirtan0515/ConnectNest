import React, { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/api";
import { listGroups } from "../../graphql/queries";
import { useNavigate } from "react-router-dom";
import "./MyGroups.css";

const client = generateClient();

const MyGroups = () => {
  const { user } = useAuthenticator();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await client.graphql({ query: listGroups, authMode: "userPool" });
        const items = res.data.listGroups.items || [];
        setGroups(items.filter((g) => g.members?.includes(user.username)));
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
  }, [user.username]);

  return (
    <div className="my-groups card">
      <div className="my-groups__header">
        <h4 className="section-title" style={{ margin: 0 }}>My Groups</h4>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate("/groups")}>
          See all
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="my-groups__empty">You haven't joined any groups yet.</p>
      ) : (
        <ul className="my-groups__list">
          {groups.map((g) => (
            <li key={g.id} className="my-groups__item" onClick={() => navigate(`/groups/${g.id}`)}>
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
