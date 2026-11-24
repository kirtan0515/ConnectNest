import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import NonAffiliation from "../../components/legal/NonAffiliation";
import "./Legal.css";

const Privacy = () => {
  return (
    <div className="cn-scope legal">
      <Navbar />
      <main className="legal__main">
        <header className="legal__hero">
          <p className="legal__eyebrow">Legal</p>
          <h1 className="cn-head legal__title">Privacy Policy</h1>
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
          <h2 className="cn-head">1. Who runs this and what this covers</h2>
          <p>
            ConnectNest is run by Kirtan Patel as a solo student capstone project and demo, on a personal AWS account in the us-east-1 region. This policy describes the data the site handles. Questions: support@connectnestapp.com.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">2. What we collect</h2>
          <ul>
            <li>Account data: your name and email address. Passwords are handled by Amazon Cognito. If you use Google or Microsoft sign-in, those providers send us your name and email.</li>
            <li>Profile data: major, interests, bio and avatar, if you add them.</li>
            <li>Content you create: posts, comments, likes, events, RSVPs, groups and group memberships.</li>
            <li>Uploaded images, stored in a private storage bucket.</li>
            <li>Direct messages and conversation records: the message text, sender name and time, the participants, and last-message and last-read times.</li>
            <li>Notifications sent to you inside the app.</li>
            <li>Multi-factor authentication (MFA) enrollment, if you turn it on. This is held by Amazon Cognito.</li>
            <li>An audit log of account actions such as deactivation, deletion, restoration and purge.</li>
            <li>Security logs: a web application firewall (AWS WAF) log of blocked requests, which includes the IP address and request details, with authorization and cookie headers redacted. AWS CloudTrail records of activity in the AWS account. Application logs from the site&apos;s servers in Amazon CloudWatch.</li>
            <li>Email sent to support@ or abuse@connectnestapp.com, if you write to us.</li>
          </ul>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">3. Who can see it</h2>
          <ul>
            <li>Your name, major, interests, bio and avatar are visible to other signed-in users. Sign-up is open, so those users may include people who are not at Harrisburg University. Your email address is not shown to other users.</li>
            <li>Posts, comments, events and groups are visible to signed-in users as shown in the app.</li>
            <li>Direct messages are visible to the people in the conversation.</li>
            <li>The operator has technical access to stored data through the AWS account.</li>
          </ul>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">4. Service providers</h2>
          <p>
            The site runs on Amazon Web Services: Amazon Cognito (sign-in), CloudFront, API Gateway, Lambda, DynamoDB, S3, WAF, CloudTrail and CloudWatch. Amazon SES sends verification and password-reset email and receives email sent to support@ and abuse@connectnestapp.com. Amazon Rekognition scans uploaded images. If you choose Google or Microsoft sign-in, that provider handles your login under its own privacy policy. Fonts and avatars are served from the site itself. There are no ads, no analytics or tracking scripts, and your data is not sold.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">5. Cookies and browser storage</h2>
          <p>
            The site stores your login tokens in your browser&apos;s local storage so you stay signed in. An access token lasts about 1 hour and a refresh token about 1 day. A temporary value is kept in session storage while you sign in with Google or Microsoft. There are no advertising cookies.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">6. How long we keep data</h2>
          <ul>
            <li>Deleted accounts: 30-day grace period, then a daily job permanently removes your profile, posts, comments, likes, events, RSVPs, group memberships and sign-in account. It also removes your conversation records, replaces the text of messages you sent with a removal notice (the other person keeps the rest of the conversation), and deletes your uploaded images.</li>
            <li>Notifications expire automatically after 90 days.</li>
            <li>Firewall (WAF) logs: 30 days. CloudTrail logs: 365 days.</li>
            <li>Application logs in CloudWatch: no fixed expiry is configured.</li>
            <li>Audit-log entries of account actions are not removed by the purge.</li>
            <li>Email sent to support@ or abuse@connectnestapp.com is received by Amazon SES, stored in a private encrypted S3 bucket for 30 days, and forwarded to the operator&apos;s personal inbox. The forwarded copy stays in that inbox until deleted.</li>
          </ul>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">7. Security</h2>
          <p>
            The site uses reasonable measures, including encrypted connections, access controls, encrypted storage in S3, and optional MFA. No system is perfectly secure, and the operator cannot guarantee that your data will never be exposed. If the operator learns of a breach affecting your data, affected users will be notified as required by applicable law.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">8. Your choices and requests</h2>
          <p>
            You can view and edit your profile in the app, and deactivate or delete your account in Settings. To ask for access to your data, a correction, a copy, or deletion, email support@connectnestapp.com from the address on your account. The operator aims to reply within 30 days. This policy does not promise rights under any particular law.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">9. Age</h2>
          <p>
            ConnectNest is for people 18 and older and is not for children. If the operator learns that someone under 18 has signed up, the account and its data will be deleted.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">10. United States only</h2>
          <p>
            ConnectNest is intended for use in the United States and is not designed for users elsewhere. Data is stored in the AWS us-east-1 region.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">11. Changes</h2>
          <p>
            This policy may change. The effective date at the top shows the latest version. Material changes will be announced with a notice on the sign-in page or by email to the address on your account.
          </p>
        </section>
        <section className="legal__block">
          <h2 className="cn-head">12. Contact</h2>
          <p>
            support@connectnestapp.com. For abuse or removal requests, abuse@connectnestapp.com.
          </p>
        </section>
        <section className="legal__back">
          <Link to="/" className="cn-btn cn-btn--outline">Back to home</Link>
        </section>
      </main>
    </div>
  );
};

export default Privacy;
