import React from "react";
import { Link } from "react-router-dom";
import "./AppFooter.css";

/**
 * Minimal in-app footer shown on authenticated pages (via MainLayout).
 * Keeps the logged-in shell feeling finished and surfaces the legal pages
 * (Privacy / Terms) that a platform handling student data should link.
 */
export default function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer" aria-label="Site footer">
      <div className="app-footer__inner">
        <span className="app-footer__brand">ConnectNest</span>
        <nav className="app-footer__links" aria-label="Footer">
          <Link to="/about">About</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
        <span className="app-footer__meta">
          Harrisburg University &middot; &copy; {year} ConnectNest
        </span>
      </div>
    </footer>
  );
}
