import React from "react";
import { useLocation } from "react-router-dom";
import DashboardNavbar from "./DashboardNavbar";
import "./MainLayout.css";

const DARK_ROUTES = ["/dashboard", "/events", "/groups", "/chat", "/files", "/profile"];

const MainLayout = ({ children }) => {
  const { pathname } = useLocation();
  const isDark = DARK_ROUTES.includes(pathname) || pathname.startsWith("/events/");

  return (
    <div className={`main-layout${isDark ? " main-layout--dark" : ""}`}>
      <DashboardNavbar />
      <main className="main-layout__content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
