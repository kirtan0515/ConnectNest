import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import "./Legal.css";

const Privacy = () => {
  return (
    <div className="cn-scope legal">
      <Navbar />

      <main className="legal__main">
        <header className="legal__hero">
          <p className="legal__eyebrow">Legal</p>
          <h1 className="cn-head legal__title">Privacy Policy</h1>
          <p className="legal__meta">Effective date: October 2026 · connectnestapp.com</p>
        </header>

        <section className="legal__block legal__disclaimer">
          <p>
            ConnectNest is a student capstone project built by students at
            Harrisburg University. It is provided "as is" for educational and
            demonstration purposes only. It is not a commercial service, and
            nothing on this page is legal advice.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">1. Overview</h2>
          <p>
            ConnectNest is a campus engagement platform for Harrisburg University
            students. This policy explains what data we collect and why.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">2. Information we collect</h2>
          <ul>
            <li>Your name and email address.</li>
            <li>
              Optional profile fields such as your major, interests, bio, and
              avatar.
            </li>
            <li>
              Content you create — posts, comments, events, RSVPs, and group
              membership — and files or images you upload.
            </li>
            <li>
              For Google or Microsoft sign-in, your name and email come from that
              identity provider.
            </li>
          </ul>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">3. How we use your information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Create and secure your account.</li>
            <li>Show your profile and content to other users.</li>
            <li>Run events, groups, and the feed features.</li>
            <li>Moderate content on the platform.</li>
          </ul>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">4. Authentication &amp; third parties</h2>
          <p>
            Authentication is handled by Amazon Cognito, with social sign-in through
            Google and Microsoft. The platform's infrastructure runs on AWS,
            including Cognito, API Gateway, Lambda, DynamoDB, S3, and CloudFront.
            Your data is stored in the United States (AWS us-east-1).{" "}
            <strong>We do not sell your data.</strong>
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">5. Content moderation</h2>
          <p>
            User text is screened by a server-side block-list. Uploaded images are
            automatically scanned by Amazon Rekognition and removed if they are
            explicit or violent.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">6. Data retention &amp; deletion</h2>
          <p>
            You can deactivate or delete your account. Deletion is a soft-delete
            with a grace period before a scheduled purge, and an audit log records
            account actions.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">7. Security</h2>
          <p>
            We use least-privilege access, encryption at rest, JWT-authorized APIs,
            and optional multi-factor authentication to help protect your data.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">8. Your rights</h2>
          <p>
            You can access and update your profile and request deletion of your
            account and data from within the app.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">9. Children / age</h2>
          <p>
            ConnectNest is intended for enrolled Harrisburg University students who
            are 18 years or older. It is not directed to children.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">10. Changes to this policy</h2>
          <p>
            We may update this policy from time to time. The effective date of this
            policy is October 2026.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">11. Contact</h2>
          <p>Questions: support@connectnestapp.com</p>
        </section>

        <section className="legal__back">
          <Link to="/" className="cn-btn cn-btn--outline">Back to home</Link>
        </section>
      </main>
    </div>
  );
};

export default Privacy;
