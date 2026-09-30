import React from "react";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const navigate = useNavigate();
  return (
    <div className="quick-actions">
      <h4 className="text-md font-semibold mb-2">⚡ Quick Actions</h4>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => navigate("/create-event")}
          className="btn-action"
        >
          Create Event
        </button>
        <button
          onClick={() => navigate("/create-group")}
          className="btn-action"
        >
          Create Group
        </button>
        <button
          onClick={() => navigate("/files")}
          className="btn-action"
        >
          Upload File
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
