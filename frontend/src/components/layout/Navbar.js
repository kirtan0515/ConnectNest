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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Navigate to a landing-page section from any page.
  const toSection = (id) => (e) => {
    e.preventDefault();
    navigate(`/#${id}`);
    // If already on the landing page, scroll smoothly.
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className={`site-nav${scrolled ? " scrolled" : ""}`}>
      <div className="site-nav__inner">
        <Link to="/" className="site-nav__brand" aria-label="ConnectNest home">
          <img src={logo} alt="ConnectNest" />
        </Link>

        <nav className="site-nav__links" aria-label="Main">
          <a href="/#features" onClick={toSection("features")}>Features</a>
          <a href="/#gallery" onClick={toSection("gallery")}>Gallery</a>
          <a href="/#testimonials" onClick={toSection("testimonials")}>Testimonials</a>
          <Link to="/about">About</Link>
        </nav>

        <div className="site-nav__actions">
          <Link to="/login" className="site-nav__login">Log in</Link>
          <Link to="/signup" className="cn-btn cn-btn--primary cn-btn--sm site-nav__signup">
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
