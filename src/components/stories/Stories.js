import "./stories.css";
import { useAuthenticator } from "@aws-amplify/ui-react";

const Stories = () => {
  const { user } = useAuthenticator();
  const username = user?.username || "User";

  // Dummy data for stories
  const dummyStories = [
    { id: 1, username: "sarah_123", avatar: "S" },
    { id: 2, username: "mike_dev", avatar: "M" },
    { id: 3, username: "travel_lisa", avatar: "L" },
    { id: 4, username: "photo_john", avatar: "J" }
  ];

  return (
    <div className="stories">
      <div className="story">
        <img
          src={`https://via.placeholder.com/60?text=${username[0].toUpperCase()}`}
          alt="Your Story"
        />
        <span>Your Story</span>
        <button className="add-story-btn" title="Add to your story">+</button>
      </div>

      {dummyStories.map(story => (
        <div className="story" key={story.id}>
          <img
            src={`https://via.placeholder.com/60?text=${story.avatar}`}
            alt={story.username}
          />
          <span>{story.username}</span>
        </div>
      ))}
    </div>
  );
};

export default Stories;