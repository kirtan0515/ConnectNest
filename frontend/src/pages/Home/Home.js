import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import StudentNetworkCanvas from "../../components/canvas/StudentNetworkCanvas";
import logo from "../../assets/connectnest-logo.png";
import harrisburgSkyline from "../../assets/harrisburg-skyline.jpg";
import huBuilding from "../../assets/hu-building.jpg";
import "./Home.css";

gsap.registerPlugin(ScrollTrigger);

/* ---- Harrisburg University "campus highlights" cards (CSS illustrations) ---- */
/* HU is an urban STEM university in downtown Harrisburg, PA. These scenes
   reflect that: a downtown tower campus, STEM/innovation labs, and the
   capital-city setting. Drawn in the card's group color via --art. */

// Innovation & STEM — a lab/circuit motif with connected nodes.
const LabArt = () => (
  <div className="ga ga--lab" aria-hidden="true">
    <svg viewBox="0 0 220 165" fill="none" preserveAspectRatio="xMidYMid meet"
      stroke="var(--art)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      {/* circuit traces */}
      <path d="M30 120h40v-40h40v-30h50" opacity="0.6" />
      <path d="M30 60h30v30" opacity="0.6" />
      {/* nodes */}
      <g fill="var(--art)" stroke="none">
        <circle cx="30" cy="120" r="7" /><circle cx="70" cy="80" r="7" />
        <circle cx="110" cy="50" r="7" /><circle cx="160" cy="50" r="9" />
        <circle cx="60" cy="90" r="5" />
      </g>
      {/* beaker */}
      <path d="M150 95v22l-14 24h40l-14-24V95" fill="none" />
      <path d="M143 128h26" />
    </svg>
  </div>
);

// Capital-city opportunities — internship/offer cards stacking up.
const OpportunityArt = () => (
  <div className="ga ga--opp" aria-hidden="true">
    <div className="ga__offer ga__offer--back" />
    <div className="ga__offer ga__offer--mid" />
    <div className="ga__offer ga__offer--front">
      <span className="ga__offer-dot" />
      <span className="ga__line ga__line--title" />
      <span className="ga__line ga__line--sub" />
    </div>
  </div>
);

const Home = () => {
  const storyRef = useRef(null);
  const lowerRef = useRef(null);
  const lenisRef = useRef(null);

  // Lenis smooth scroll (landing page only), synced with ScrollTrigger.
  useEffect(() => {
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis();
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Anchor links scroll through Lenis (falls back to native).
  const scrollTo = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -80 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="cn-scope home" id="top">
      <StudentNetworkCanvas storyRef={storyRef} lowerRef={lowerRef} />

      {/* Navbar */}
      <header className="home-nav">
        <Link to="/" className="home-nav__brand">
          <img src={logo} alt="ConnectNest" />
        </Link>
        <nav className="home-nav__links" aria-label="Main">
          <a href="#features" onClick={(e) => scrollTo(e, "features")}>Features</a>
          <a href="#gallery" onClick={(e) => scrollTo(e, "gallery")}>Gallery</a>
          <a href="#testimonials" onClick={(e) => scrollTo(e, "testimonials")}>Testimonials</a>
          <Link to="/about" className="home-nav__about">About</Link>
          <Link to="/login" className="home-nav__login">Log in</Link>
          <Link to="/signup" className="cn-btn cn-btn--primary cn-btn--sm">Sign up</Link>
        </nav>
      </header>

      <main className="home-main">
        {/* Hero */}
        <section className="hero">
          <p className="hero__eyebrow cn-fade">
            <span className="hero__dot cn-live" aria-hidden="true" />
            Your campus, connected
          </p>
          <h1 className="hero__title">
            <span className="cn-mask"><span className="cn-rise">Everything happening</span></span>
            <span className="cn-mask"><span className="cn-rise" style={{ animationDelay: "0.1s" }}>on campus,</span></span>
            <span className="cn-mask"><span className="cn-rise" style={{ animationDelay: "0.2s" }}>in one place.</span></span>
          </h1>
          <div className="hero__row cn-fade">
            <p className="hero__sub">
              Connect with peers, join events, share ideas and grow your network,
              all on a secure, student-first platform.
            </p>
            <div className="hero__actions">
              <Link to="/signup" className="cn-btn cn-btn--primary">Get started free</Link>
              <Link to="/login" className="cn-btn cn-btn--outline">Log in</Link>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="story" ref={storyRef} aria-label="How students connect">
          <div className="story__block">
            <div className="story__text">
              <h2 className="cn-head story__h">Find your people.</h2>
              <p className="story__p">
                Classmates, teammates, the person who also wants to start a band.
                ConnectNest brings students together around what they actually share.
              </p>
            </div>
          </div>
          <div className="story__block">
            <div className="story__text">
              <h2 className="cn-head story__h">Then the whole campus links up.</h2>
              <p className="story__p">
                Events, posts and chats connect one group to the next, until the
                study group knows the robotics club and everyone knows where
                Friday's open mic is.
              </p>
            </div>
          </div>
        </section>

        {/* Lower content (fades canvas) */}
        <div className="lower" ref={lowerRef}>
          {/* Features */}
          <section id="features" className="features">
            <div className="section-head">
              <h2 className="cn-head">Why ConnectNest?</h2>
              <p>Built for students, powered by modern cloud infrastructure.</p>
            </div>
            <div className="features__grid">
              <div className="feature">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--group-1)" strokeWidth="1.6" aria-hidden="true">
                  <rect x="4" y="6" width="20" height="18" rx="3" /><path d="M4 11h20M10 3v5M18 3v5" />
                </svg>
                <h3>Campus Events</h3>
                <p>Discover, create and RSVP to events happening across your campus.</p>
              </div>
              <div className="feature">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--group-2)" strokeWidth="1.6" aria-hidden="true">
                  <circle cx="10" cy="10" r="4" /><circle cx="19" cy="12" r="3" /><path d="M3 23c1-4 4-6 7-6s6 2 7 6M16 18c3-1 7 0 9 4" />
                </svg>
                <h3>Groups &amp; Communities</h3>
                <p>Find your people. Join clubs, study groups and interest communities.</p>
              </div>
              <div className="feature">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--group-3)" strokeWidth="1.6" aria-hidden="true">
                  <path d="M5 6h18v12H12l-5 4v-4H5z" /><path d="M9 11h10M9 14h6" />
                </svg>
                <h3>Real-time Feed</h3>
                <p>Share posts, like and comment. Stay in the loop with campus life.</p>
              </div>
              <div className="feature">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--group-4)" strokeWidth="1.6" aria-hidden="true">
                  <path d="M14 3l9 4v6c0 6-4 10-9 12-5-2-9-6-9-12V7z" /><path d="M10 14l3 3 5-6" />
                </svg>
                <h3>Secure by Design</h3>
                <p>Cognito-backed auth and least-privilege access keep student data safe.</p>
              </div>
            </div>
          </section>

          {/* Campus highlights — Harrisburg University, downtown Harrisburg */}
          <section id="gallery" className="gallery">
            <div className="section-head">
              <h2 className="cn-head">Campus highlights</h2>
              <p>Student life at Harrisburg University, in the heart of downtown Harrisburg.</p>
            </div>

            {/* Real skyline of Harrisburg, PA — HU's downtown home */}
            <figure className="gallery__banner">
              <img
                src={harrisburgSkyline}
                alt="The downtown Harrisburg, Pennsylvania skyline"
                loading="lazy"
              />
              <figcaption>
                Downtown Harrisburg, PA — home of Harrisburg University.
                <span className="gallery__credit">
                  Photo: Jeffrey Hayes, CC BY 2.0, via Wikimedia Commons
                </span>
              </figcaption>
            </figure>

            <div className="gallery__grid">
              <figure className="gallery__item">
                <div className="gallery__art gallery__art--45 gallery__art--photo">
                  <img
                    className="gallery__photo"
                    src={huBuilding}
                    alt="The Harrisburg University building in downtown Harrisburg"
                    loading="lazy"
                  />
                </div>
                <figcaption>The Harrisburg University building on Market Street</figcaption>
              </figure>
              <figure className="gallery__item">
                <div className="gallery__art gallery__art--43" style={{ "--art": "var(--group-1)" }}>
                  <LabArt />
                </div>
                <figcaption>Innovation, AI &amp; STEM labs</figcaption>
              </figure>
              <figure className="gallery__item">
                <div className="gallery__art gallery__art--11" style={{ "--art": "var(--group-4)" }}>
                  <OpportunityArt />
                </div>
                <figcaption>Internships in the capital city</figcaption>
              </figure>
            </div>
          </section>

          {/* Built for moments like these (reframed from fake testimonials) */}
          <section id="testimonials" className="testimonials">
            <div className="section-head">
              <h2 className="cn-head">Built for moments like these</h2>
              <p>The kind of connections ConnectNest is designed to make easy.</p>
            </div>
            <div className="testimonials__grid">
              <figure className="testimonial">
                <blockquote>&ldquo;Found my study group and heard about an internship through it, all in one week.&rdquo;</blockquote>
                <figcaption>
                  <span className="testimonial__avatar" style={{ background: "var(--group-1)" }} aria-hidden="true">CS</span>
                  <span className="testimonial__who"><strong>A first-year</strong><span>Computer Science</span></span>
                </figcaption>
              </figure>
              <figure className="testimonial">
                <blockquote>&ldquo;One feed to keep up with every club, event and conversation on campus.&rdquo;</blockquote>
                <figcaption>
                  <span className="testimonial__avatar" style={{ background: "var(--group-2)" }} aria-hidden="true">BA</span>
                  <span className="testimonial__who"><strong>A club organizer</strong><span>Business Administration</span></span>
                </figcaption>
              </figure>
            </div>
          </section>

          {/* CTA */}
          <section className="cta">
            <h2 className="cn-head">Ready to connect with your campus?</h2>
            <p>Set up your profile and start finding your people today.</p>
            <Link to="/signup" className="cn-btn cn-btn--primary cta__btn">Create your free account</Link>
          </section>

          {/* Footer */}
          <footer className="home-footer">
            <div className="home-footer__top">
              <div className="home-footer__brand">
                <span className="home-footer__name">ConnectNest</span>
                <span>Connecting campuses worldwide.</span>
              </div>
              <div className="home-footer__cols">
                <nav aria-label="Explore">
                  <strong>Explore</strong>
                  <a href="#features" onClick={(e) => scrollTo(e, "features")}>Features</a>
                  <a href="#gallery" onClick={(e) => scrollTo(e, "gallery")}>Gallery</a>
                  <a href="#testimonials" onClick={(e) => scrollTo(e, "testimonials")}>Testimonials</a>
                  <Link to="/about">About</Link>
                </nav>
                <nav aria-label="Get started">
                  <strong>Get started</strong>
                  <Link to="/signup">Sign up</Link>
                  <Link to="/login">Log in</Link>
                </nav>
                <nav aria-label="Legal">
                  <strong>Legal</strong>
                  <Link to="/terms">Terms &amp; Conditions</Link>
                  <Link to="/privacy">Privacy Policy</Link>
                </nav>
              </div>
            </div>
            <p className="home-footer__copy">© 2026 ConnectNest. All rights reserved.</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Home;
