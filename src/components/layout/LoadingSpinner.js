import React from "react";
import "./LoadingSpinner.css"; // Ensure this path exists

const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner-square">
        <div className="square-1 square"></div>
        <div className="square-2 square"></div>
        <div className="square-3 square"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
