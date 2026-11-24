import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import NonAffiliation from "../../components/legal/NonAffiliation";
import "./Legal.css";

const Terms = () => {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView();
  }, [hash]);
  return (
    <div className="cn-scope legal">
      <Navbar />
      <main className="legal__main">
        <header className="legal__hero">
          <p className="legal__eyebrow">Legal</p>
          <h1 className="cn-head legal__title">Terms &amp; Conditions</h1>
          <p className="legal__meta">Effective date: November 24, 2026 · Last updated: November 24, 2026 · connectnestapp.com</p>
        </header>
        <section className="legal__block legal__disclaimer">
          <NonAffiliation />
          <p>
            ConnectNest is a demo built and run by Kirtan Patel as a solo
            student capstone project. It runs on a personal Amazon Web Services
            (AWS) account in the us-east-1 (N. Virginia) region. Please do not
            share sensitive information on it.
          </p>
          <p>
            This page is a plain-language description of how the site works. It
            is not legal advice and has not been reviewed by a lawyer.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">1. About the service and the operator</h2>
          <p>
            ConnectNest is operated by Kirtan Patel, a student, as a capstone project. It is a demo, provided &quot;as is&quot; and &quot;as available.&quot; It may change, be unavailable, or be shut down at any time, and data on it may be lost. By creating an account or using the site at connectnestapp.com, you agree to these terms. If you do not agree, please do not use it.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">2. Who can use ConnectNest</h2>
          <p>
            You must be 18 years or older to use ConnectNest. It is intended for university students in the United States. Sign-up is open and the operator does not verify your age or enrollment. If you are under 18, do not sign up. If the operator learns that an account belongs to someone under 18, the account may be deleted.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">3. Your account</h2>
          <p>
            You sign in through Amazon Cognito with an email and password, or with Google or Microsoft sign-in. With a social sign-in, your name and email address come from that provider. You are responsible for your credentials and for activity on your account. Optional multi-factor authentication (MFA) is available in Settings. Keep your account information accurate.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">4. Acceptable use</h2>
          <p>
            ConnectNest has profiles, events and RSVPs, posts with likes and comments, groups, direct messages, and image uploads. When you use it, you must not:
          </p>
          <ul>
            <li>Post unlawful, harassing, hateful, threatening, or sexually explicit content.</li>
            <li>Post private information about other people, or intimate images of anyone without their consent.</li>
            <li>Post or upload content you do not have the right to use.</li>
            <li>Impersonate other people or misrepresent who you are.</li>
            <li>Misuse, disrupt, scrape, or attempt to break the service.</li>
          </ul>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">5. Your content</h2>
          <p>
            You keep ownership of what you post. You confirm that you have the rights and permissions to everything you upload or post, including photos of other people and artwork or text made by others. You give the operator a limited licence to store, process (including image scanning by Amazon Rekognition), back up, display within the app, and remove that content, so the service can work.
          </p>
          <p>
            Text in posts, comments and direct messages is checked against a server-side block-list. Uploaded images are scanned automatically, and images detected as explicit or violent are deleted. Direct messages are visible to the people in the conversation. The operator does not read them as a routine matter, but has technical access to stored data and may review content that is reported or when needed to operate the service. Content or accounts that break these terms may be removed.
          </p>
        </section>
        <section className="legal__block" id="report">
          <h2 className="cn-head">6. Reporting abuse, copyright and takedown requests</h2>
          <p>
            To report abusive content, a copyright problem, or to ask for removal of an intimate image shared without consent, email abuse@connectnestapp.com. Put &quot;Abuse&quot;, &quot;Copyright&quot; or &quot;Intimate image removal&quot; in the subject line, and include a link or description that lets the operator find the content. You can also use support@connectnestapp.com. The operator will try to review reports promptly and will remove intimate images on request, but cannot promise a specific response time.
          </p>
          <p>
            A copyright notice should include: (a) identification of the copyrighted work; (b) where the material is on the site; (c) your name, address, email and phone number; (d) a statement that you believe in good faith that the use is not authorized by the owner, its agent, or the law; (e) a statement that the information is accurate and, under penalty of perjury, that you are the owner or authorized to act for the owner; and (f) your physical or electronic signature. If your content is removed after a notice, you may send a counter-notice to the same address.
          </p>
          <p>
            Accounts of users who repeatedly post infringing content may be disabled. The operator has not registered a designated agent with the U.S. Copyright Office and does not claim any statutory safe-harbor status.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">7. Deletion and termination</h2>
          <p>
            You can deactivate or delete your account in Settings. Deletion starts a 30-day grace period during which you can restore the account. After that, a scheduled job permanently removes your profile, posts, comments, likes, events, RSVPs, group memberships and sign-in account. It also deletes your conversation records and your uploaded images, and it replaces the text of direct messages you sent with a removal notice, so the other person&apos;s conversation history keeps its shape. An audit log of account actions is kept. The operator may suspend or end accounts that break these terms.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">8. Disclaimers and limit of liability</h2>
          <p>
            ConnectNest is a student demo. To the extent permitted by law, it is provided without warranties of any kind, and the operator is not liable for damages arising from your use of it, including loss of data. Some places do not allow these limits, so they may not apply to you in full.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">9. Governing law and venue</h2>
          <p>
            These terms are governed by the laws of the Commonwealth of Pennsylvania, United States. Disputes will be brought in the state or federal courts located in Dauphin County, Pennsylvania, to the extent the law allows.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">10. Third-party services</h2>
          <p>
            The site relies on Amazon Web Services, and on Google and Microsoft if you choose their sign-in. Those services have their own terms and privacy policies. Details are in the Privacy Policy.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">11. Changes to these terms</h2>
          <p>
            These terms may change. The effective date at the top shows the latest version. Material changes will be announced with a notice on the sign-in page or by email to the address on your account. If you keep using ConnectNest after a change, you accept the new terms.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">12. Contact</h2>
          <p>
            General questions: support@connectnestapp.com. Abuse, copyright and removal requests: abuse@connectnestapp.com.
          </p>
        </section>
        <section className="legal__back">
          <Link to="/" className="cn-btn cn-btn--outline">Back to home</Link>
        </section>
      </main>
    </div>
  );
};

export default Terms;
