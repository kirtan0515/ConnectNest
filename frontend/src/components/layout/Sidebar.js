import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-1/5 h-screen bg-white shadow-lg p-6">
      <h2 className="text-xl font-bold">ConnectNest</h2>
      <nav>
        <ul className="mt-4 space-y-4">
          <li><Link to="/dashboard" className="text-gray-700 hover:text-black">🏠 Dashboard</Link></li>
          <li><Link to="/events" className="text-gray-700 hover:text-black">📅 Events</Link></li>
          <li><Link to="/groups" className="text-gray-700 hover:text-black">👥 Groups</Link></li>
          <li><Link to="/chat" className="text-gray-700 hover:text-black">💬 Chat</Link></li>
          <li><Link to="/files" className="text-gray-700 hover:text-black">📂 Files</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
