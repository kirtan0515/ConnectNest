import React from "react";
import DashboardNavbar from "./DashboardNavbar";
import "./MainLayout.css";

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      <DashboardNavbar />
      <main className="main-layout__content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
