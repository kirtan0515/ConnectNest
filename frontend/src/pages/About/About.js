import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import "./About.css";

const STACK = [
  { k: "Amazon Cognito", v: "Secure sign-up, login and email verification." },
  { k: "API Gateway", v: "A single HTTP API, guarded by a Cognito authorizer." },
  { k: "AWS Lambda", v: "Serverless functions run the business logic." },
  { k: "DynamoDB", v: "Fast, scalable storage — one table per entity." },
  { k: "Amazon S3", v: "File and image uploads via presigned URLs." },
  { k: "AWS CDK", v: "The whole stack defined as code, deployed with one command." },
];

const About = () => {
  return (
    <div className="cn-scope about">
      <Navbar />

      <main className="about__main">
        <section className="about__hero">
          <p className="about__eyebrow">About ConnectNest</p>
          <h1 className="cn-head about__title">
            One place for everything happening on campus.
          </h1>
          <p className="about__lead">
            ConnectNest is a campus engagement platform for students at
            Harrisburg University. Events, groups, posts and messages live
            together in one app, so it's easy to find your people and stay in
            the loop with campus life.
          </p>
        </section>

        <section className="about__block">
          <h2 className="cn-head">Why it exists</h2>
          <p>
            Campus life gets scattered across group chats, flyers, email threads
            and word of mouth. ConnectNest brings it together: discover and RSVP
            to events, join clubs and interest groups, share posts, and message
            peers, all in a single secure place built for students.
          </p>
        </section>

        <section className="about__block">
          <h2 className="cn-head">Built on modern AWS cloud</h2>
          <p>
            ConnectNest is a serverless application, and its entire
            infrastructure is written explicitly as code. That means it is
            reproducible, scalable, and secure by design, with every protected
            request verified against the signed-in user.
          </p>
          <dl className="about__stack">
            {STACK.map((s) => (
              <div className="about__stack-row" key={s.k}>
                <dt>{s.k}</dt>
                <dd>{s.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="about__cta">
          <h2 className="cn-head">Ready to connect with your campus?</h2>
          <div className="about__cta-actions">
            <Link to="/signup" className="cn-btn cn-btn--primary">Get started free</Link>
            <Link to="/" className="cn-btn cn-btn--outline">Back to home</Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
