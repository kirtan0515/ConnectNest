import React from "react";

const RightSidebar = () => {
  return (
    <div className="w-1/5 h-screen bg-white shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">Trending Events</h2>
      <ul>
        <li className="text-gray-700">🎉 Tech Fest 2025</li>
        <li className="text-gray-700">📢 Hackathon</li>
        <li className="text-gray-700">🎭 Cultural Night</li>
      </ul>
    </div>
  );
};

export default RightSidebar;
