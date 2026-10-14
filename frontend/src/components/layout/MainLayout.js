import React from "react";
import { useLocation } from "react-router-dom";
import DashboardNavbar from "./DashboardNavbar";
import "./MainLayout.css";

const MainLayout = ({ children }) => {
  const { pathname } = useLocation();
  const isDashboard = pathname === "/dashboard";

  return (
    <div className={`main-layout${isDashboard ? " main-layout--dark" : ""}`}>
      <DashboardNavbar />
      <main className="main-layout__content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
