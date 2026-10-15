import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/connectnest-logo.png";
import "./Navbar.css";

/**
 * Public site navbar (landing + about). Pine-teal glassy bar matching the
 * landing page. Section links jump to the landing page's anchors — using the
 * router so they work from /about too.
 */
const Navbar = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setOpen(false);

  // Close the mobile menu on Escape.
  const onKeyDown = (e) => {
    if (e.key === "Escape") setOpen(false);
  };

  // Navigate to a landing-page section from any page.
  const toSection = (id) => (e) => {
    e.preventDefault();
    setOpen(false);
    navigate(`/#${id}`);
    // If already on the landing page, scroll smoothly.
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`site-nav${scrolled ? " scrolled" : ""}${open ? " is-open" : ""}`}
      onKeyDown={onKeyDown}
    >
      <div className="site-nav__inner">
        <Link to="/" className="site-nav__brand" aria-label="ConnectNest home">
          <img src={logo} alt="ConnectNest" />
        </Link>

        <button
          type="button"
          className="site-nav__toggle"
          aria-expanded={open}
          aria-controls="site-nav-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          )}
        </button>

        <div className="site-nav__menu" id="site-nav-menu">
          <nav className="site-nav__links" aria-label="Main">
            <a href="/#features" onClick={toSection("features")}>Features</a>
            <a href="/#gallery" onClick={toSection("gallery")}>Gallery</a>
            <a href="/#testimonials" onClick={toSection("testimonials")}>Testimonials</a>
            <Link to="/about" onClick={closeMenu}>About</Link>
          </nav>

          <div className="site-nav__actions">
            <Link to="/login" className="site-nav__login" onClick={closeMenu}>Log in</Link>
            <Link to="/signup" className="cn-btn cn-btn--primary cn-btn--sm site-nav__signup" onClick={closeMenu}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
