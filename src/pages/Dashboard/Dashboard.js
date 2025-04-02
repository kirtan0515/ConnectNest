import Stories from "../../components/stories/Stories";
import Share from "../../components/share/Share";
import Posts from "../../components/post/Post"; // This is the merged file
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard">
      {/* Left Sidebar */}
      <div className="sidebar-left">
        <h3>Shortcuts</h3>
        <ul>
          <li>📅 Events</li>
          <li>💬 Chat</li>
          <li>🧑‍🤝‍🧑 Groups</li>
          <li>📁 Files</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-feed">
        <Stories />
        <Share />
        <Posts />
      </div>

      {/* Right Sidebar */}
      <div className="sidebar-right">
        <h3>Upcoming Events</h3>
        <ul>
          <li>🎉 Orientation Week</li>
          <li>📢 Campus Hackathon</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
