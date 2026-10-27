import React from "react";
import { useLocation } from "react-router-dom";
import DashboardNavbar from "./DashboardNavbar";
import AppFooter from "./AppFooter";
import "./MainLayout.css";

const DARK_ROUTES = ["/dashboard", "/events", "/groups", "/chat", "/files", "/profile", "/settings"];

const MainLayout = ({ children }) => {
  const { pathname } = useLocation();
  const isDark = DARK_ROUTES.includes(pathname) || pathname.startsWith("/events/");

  return (
    <div className={`main-layout${isDark ? " main-layout--dark" : ""}`}>
      <DashboardNavbar />
      <main className="main-layout__content">
        {children}
      </main>
      <AppFooter />
    </div>
  );
};

export default MainLayout;
