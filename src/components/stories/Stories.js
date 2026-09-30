import React from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import "./stories.css";

const DUMMY = [
  { id: 1, name: "sarah_123" },
  { id: 2, name: "mike_dev" },
  { id: 3, name: "travel_lisa" },
  { id: 4, name: "photo_john" },
  { id: 5, name: "campus_news" },
];

const Stories = () => {
  const { user } = useAuthenticator();
  const attrs = user?.attributes || {};
  const displayName =
    attrs.name ||
    attrs.preferred_username ||
    (attrs.email ? attrs.email.split("@")[0] : null) ||
    "You";

  return (
    <div className="stories card">
      {/* Your story */}
      <div className="story story--add">
        <div className="story__ring story__ring--add">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0a66c2&color=fff&size=80`}
            alt="Your story"
            className="story__img"
          />
          <div className="story__add-icon">+</div>
        </div>
        <span className="story__name">Your Story</span>
      </div>

      {DUMMY.map((s) => (
        <div className="story" key={s.id}>
          <div className="story__ring">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random&size=80`}
              alt={s.name}
              className="story__img"
            />
          </div>
          <span className="story__name">{s.name.split("_")[0]}</span>
        </div>
      ))}
    </div>
  );
};

export default Stories;
