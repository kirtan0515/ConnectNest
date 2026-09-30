import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";
import logo from "../../assets/connectnest-logo.png";
import "./DashboardNavbar.css";

export default function DashboardNavbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthenticator((ctx) => [ctx.user, ctx.signOut]);
  const [menuOpen, setMenuOpen] = useState(false);

  const attrs = user?.attributes || {};

  // Cognito username is a UUID when signing up with email — always prefer
  // the human-readable name or email prefix
  const displayName =
    attrs.name ||
    attrs.preferred_username ||
    (attrs.email ? attrs.email.split("@")[0] : null) ||
    "User";

  const initials = displayName.slice(0, 2).toUpperCase();
  const pictureUrl = attrs.picture || "";

  return (
    <header className="dash-navbar">
      <div className="dash-navbar__inner">
        {/* Logo */}
        <button className="dash-navbar__logo" onClick={() => navigate("/dashboard")}>
          <img src={logo} alt="ConnectNest" />
        </button>

        {/* Nav links */}
        <nav className="dash-navbar__nav">
          <NavLink to="/dashboard" className={({ isActive }) => "dash-nav-item" + (isActive ? " active" : "")}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span>Home</span>
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => "dash-nav-item" + (isActive ? " active" : "")}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
            <span>Events</span>
          </NavLink>
          <NavLink to="/groups" className={({ isActive }) => "dash-nav-item" + (isActive ? " active" : "")}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            <span>Groups</span>
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => "dash-nav-item" + (isActive ? " active" : "")}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            <span>Messages</span>
          </NavLink>
          <NavLink to="/files" className={({ isActive }) => "dash-nav-item" + (isActive ? " active" : "")}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>
            <span>Files</span>
          </NavLink>
        </nav>

        {/* Right: avatar menu */}
        <div className="dash-navbar__right">
          <button className="dash-avatar-btn" onClick={() => setMenuOpen((o) => !o)}>
            {pictureUrl
              ? <img src={pictureUrl} alt={displayName} className="avatar" style={{ width: 36, height: 36 }} />
              : <div className="dash-avatar-initials">{initials}</div>
            }
            <svg className="dash-avatar-caret" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
          </button>

          {menuOpen && (
            <div className="dash-dropdown">
              <div className="dash-dropdown__header">
                {pictureUrl
                  ? <img src={pictureUrl} alt={displayName} className="avatar" style={{ width: 48, height: 48 }} />
                  : <div className="dash-avatar-initials lg">{initials}</div>
                }
                <div>
                  <div className="dash-dropdown__name">{displayName}</div>
                  <div className="dash-dropdown__email">{attrs.email || ""}</div>
                </div>
              </div>
              <div className="divider" />
              <button className="dash-dropdown__item" onClick={() => { navigate("/profile"); setMenuOpen(false); }}>
                View Profile
              </button>
              <button className="dash-dropdown__item" onClick={() => { navigate("/settings"); setMenuOpen(false); }}>
                Settings
              </button>
              <div className="divider" />
              <button className="dash-dropdown__item danger" onClick={signOut}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
