import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import "./Legal.css";

const Terms = () => {
  return (
    <div className="cn-scope legal">
      <Navbar />

      <main className="legal__main">
        <header className="legal__hero">
          <p className="legal__eyebrow">Legal</p>
          <h1 className="cn-head legal__title">Terms &amp; Conditions</h1>
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
          <h2 className="cn-head">1. Acceptance of these terms</h2>
          <p>
            By using ConnectNest at connectnestapp.com, you agree to these terms.
            If you do not agree with them, please do not use the platform.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">2. Who can use ConnectNest</h2>
          <p>
            ConnectNest is intended for Harrisburg University students. To use it,
            you must be 18 years or older and an enrolled or affiliated student.
            You are responsible for your account and for keeping your credentials
            secure. Optional multi-factor authentication (MFA) is available to add
            another layer of protection.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">3. Your account</h2>
          <p>
            You sign in through Amazon Cognito using an email and password, or with
            Google or Microsoft sign-in. When you use a social sign-in, your name
            and email address come from that provider. Please keep your account
            information accurate and up to date.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">4. Acceptable use</h2>
          <p>
            ConnectNest supports profiles, events and RSVPs, posts with likes and
            comments, groups, and file and image uploads. When you use these
            features, you must not:
          </p>
          <ul>
            <li>Post unlawful, harassing, hateful, or explicit content.</li>
            <li>Impersonate other people or misrepresent who you are.</li>
            <li>Misuse, disrupt, or attempt to break the service.</li>
          </ul>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">5. User content &amp; moderation</h2>
          <p>
            You keep ownership of the content you post, and you grant ConnectNest
            permission to display it within the app so other users can see it. Text
            is screened by a server-side block-list, and uploaded images are
            automatically scanned by Amazon Rekognition and removed if they are
            explicit or violent. We may remove content or restrict accounts that
            violate these terms.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">6. Account termination &amp; deletion</h2>
          <p>
            You can deactivate or delete your account at any time. Deletion is a
            soft-delete with a grace period before a scheduled purge, and an audit
            log records account actions. We may suspend or terminate accounts that
            break these terms.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">7. Disclaimers &amp; limitation of liability</h2>
          <p>
            ConnectNest is provided "as is" and "as available," without warranties
            of any kind. Because it is a student project, it may be unavailable,
            change, or be discontinued at any time. To the fullest extent permitted
            by law, the student team is not liable for any damages arising from your
            use of the platform.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">8. Governing law</h2>
          <p>
            These terms are governed by the laws of the Commonwealth of
            Pennsylvania, United States.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">9. Changes to these terms</h2>
          <p>
            We may update these terms from time to time. Continued use of
            ConnectNest after an update means you accept the revised terms. The
            effective date of these terms is October 2026.
          </p>
        </section>

        <section className="legal__block">
          <h2 className="cn-head">10. Contact</h2>
          <p>Questions: support@connectnestapp.com</p>
        </section>

        <section className="legal__back">
          <Link to="/" className="cn-btn cn-btn--outline">Back to home</Link>
        </section>
      </main>
    </div>
  );
};

export default Terms;
