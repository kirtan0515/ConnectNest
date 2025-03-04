import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import CTASection from "../../ui-components/CTASection";
import campusHero from "../../assets/campus-hero.jpg";
import campus1 from "../../assets/campus-1.jpg";
import campus2 from "../../assets/campus-2.jpg";
import campus3 from "../../assets/campus-3.jpg";
import logo from "../../assets/connectnest-logo.png";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // If the user scrolls more than 50px, set scrolled to true
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="home-page">
      {/* Sticky Navbar with dynamic styling based on scroll */}
      <Navbar scrolled={scrolled} />

      {/* Hero Section with parallax effect */}
      <header
        className="hero-section"
        style={{ backgroundImage: `url(${campusHero})` }}
      >
        <div className="hero-text">
          <h1>Grow Your Professional Network with ConnectNest</h1>
          <p>
            Connect, learn, and grow with students &amp; professionals worldwide.
          </p>
          <div className="hero-buttons">
            <button
              className="btn-primary"
              onClick={() => navigate("/signup")}
            >
              Join Now
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/about")}
            >
              Learn More
            </button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section" id="features">
        <h2>Why Choose ConnectNest?</h2>
        <div className="features-container">
          <div className="feature-card">
            <h3>👥 Build Your Network</h3>
            <p>Connect with like-minded students &amp; professionals.</p>
          </div>
          <div className="feature-card">
            <h3>💼 Career Opportunities</h3>
            <p>Find internships &amp; jobs tailored for students.</p>
          </div>
          <div className="feature-card">
            <h3>📚 Learn &amp; Grow</h3>
            <p>Join discussions, share ideas, and gain knowledge.</p>
          </div>
        </div>
      </section>

      {/* Gallery / Highlights Section */}
      <section className="gallery-section" id="gallery">
        <h2>Campus Highlights</h2>
        <div className="gallery-container">
          <div className="gallery-item">
            <img src={campus1} alt="Campus Life 1" />
            <p>Vibrant campus gatherings</p>
          </div>
          <div className="gallery-item">
            <img src={campus2} alt="Campus Life 2" />
            <p>Collaborative study sessions</p>
          </div>
          <div className="gallery-item">
            <img src={campus3} alt="Campus Life 3" />
            <p>Join clubs &amp; organizations</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

      {/* Testimonials Section */}
      <section className="testimonials-section" id="testimonials">
        <h2>What Our Users Say</h2>
        <div className="testimonial">
          <p>
            “ConnectNest helped me land my first internship! Highly recommended.”
          </p>
          <h4>— Alex J.</h4>
        </div>
        <div className="testimonial">
          <p>
            “The best networking platform for students and young professionals.”
          </p>
          <h4>— Maria S.</h4>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src={logo} alt="ConnectNest Logo" />
            <p>Connecting campuses worldwide</p>
          </div>
          <div className="footer-links">
            <h4>Explore</h4>
            <ul>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#gallery">Gallery</a>
              </li>
              <li>
                <a href="#testimonials">Testimonials</a>
              </li>
            </ul>
          </div>
          <div className="footer-newsletter">
            <h4>Stay Updated</h4>
            <p>
              Sign up for our newsletter to never miss an update.
            </p>
            <div className="newsletter-input">
              <input type="email" placeholder="Email address" />
              <button>Sign me up</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} ConnectNest | All Rights Reserved
          </p>
          <div className="footer-bottom-links">
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
