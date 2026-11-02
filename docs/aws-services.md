# ConnectNest — AWS Services (what, why, how)

A study sheet for the midterm Q&A. Every service below is actually deployed in
AWS account us-east-1, defined as code with the AWS CDK across **9 stacks**
(Data, Auth, Api, Hosting, Security, Email, Dns, Realtime). The app is live at
**https://connectnestapp.com**.

> Meta-point to lead with: *every one of these is a managed, serverless service —
> nothing to patch, scales automatically, costs cents at this scale — and the
> whole platform deploys or tears down with one command via the CDK. The skill
> being demonstrated is designing cloud architecture, not just writing app code.*

---

## Core request flow (the path a user action travels)

### 1. Amazon Route 53 — DNS
- **What:** AWS's DNS service; authoritative nameserver for `connectnestapp.com`.
- **Why:** Moved DNS off the registrar so the **apex domain** could point directly
  at CloudFront (a registrar can't CNAME a bare domain; Route 53's ALIAS can).
- **How:** An ALIAS record maps `connectnestapp.com` → the CloudFront distribution.
  Also holds the DKIM + cert-validation records for email/TLS.

### 2. AWS Certificate Manager (ACM) — TLS
- **What:** Issues and auto-renews the SSL/TLS certificate.
- **Why:** HTTPS is required; ACM certs are free and auto-renew (no manual certs).
- **How:** A DNS-validated cert for `connectnestapp.com` is attached to CloudFront.

### 3. Amazon CloudFront — CDN + single entry point
- **What:** Global content delivery network.
- **Why:** Fast global delivery, HTTPS termination, and serving the whole app from
  **one origin** (no CORS, one place to attach security).
- **How:** `/` serves the React app from S3; `/api/*` routes to the backend API.
  A CloudFront Function strips the `/api` prefix before forwarding.

### 4. AWS WAF — web application firewall
- **What:** A firewall at the CloudFront edge.
- **Why:** Defense-in-depth — blocks common attacks before they reach the app.
- **How:** A WebACL with AWS managed rule sets (Common Rule Set, Known Bad Inputs)
  plus a rate limit, attached to the CloudFront distribution.

### 5. Amazon S3 — static hosting + uploads (two buckets)
- **What:** Object storage.
- **Why:** Cheapest, simplest way to host a static React build and store uploads.
- **How:**
  - **Web bucket:** the built React SPA; **private**, reachable only through
    CloudFront via Origin Access Control (OAC) — never public.
  - **Uploads bucket:** receives user images via short-lived **presigned POST**
    URLs; private (BLOCK_ALL public access), encrypted at rest.

### 6. Amazon API Gateway — the API layer (two APIs)
- **What:** Managed API front door.
- **Why:** Fully managed, auto-scales, integrates natively with Cognito + Lambda.
- **How:**
  - **HTTP API:** REST endpoints (`/posts`, `/events`, `/groups`, …), each behind
    a Cognito JWT authorizer.
  - **WebSocket API:** the real-time channel for live push (separate API).

### 7. AWS Lambda — compute (business logic)
- **What:** Serverless functions (Node.js 22).
- **Why:** No servers to manage, scales to zero (free when idle), pay-per-request —
  ideal for a student project with bursty, low traffic.
- **How:** **One function per feature** (createPost, listEvents, rsvp, joinGroup,
  getUploadUrl, …), each with its own least-privilege IAM role. API Gateway
  invokes them; they read/write DynamoDB and S3.

### 8. Amazon DynamoDB — database
- **What:** Serverless NoSQL database.
- **Why:** Auto-scales, pay-per-request, no DB server to run — fits the serverless
  model and is near-free at this scale.
- **How:** **One table per entity** (Profiles, Events, RSVPs, Posts, Comments,
  PostLikes, Groups, GroupMembers, AuditLog, Connections), with GSIs for access
  patterns like "my groups" and "my RSVPs."

---

## Identity & communication

### 9. Amazon Cognito — authentication
- **What:** Managed user identity / auth service.
- **Why:** Never hand-roll password hashing or JWT handling — Cognito does signup,
  login, tokens, MFA, and social federation securely.
- **How:** A User Pool handles email/password + **Google and Microsoft** sign-in
  (federated via the Hosted UI), issues JWTs, and supports optional TOTP MFA.
  API Gateway's authorizer validates those JWTs on every protected route.

### 10. Amazon SES — transactional email
- **What:** Email sending service.
- **Why:** Send **branded verification / password-reset emails** from the project's
  own domain instead of a generic Cognito sender.
- **How:** Cognito's custom-message Lambda trigger builds the branded HTML (logo +
  6-digit code); SES sends it from `no-reply@connectnestapp.com`, DKIM-signed.
  Now in **production** access, so it reaches any address (not just verified ones).

### 11. AWS Secrets Manager — secrets
- **What:** Encrypted secret storage.
- **Why:** Keep the Google OAuth client secret out of the template and the repo.
- **How:** The secret lives in Secrets Manager; the Cognito Google IdP references
  it dynamically at deploy time.

---

## Trust & safety + security / observability

### 12. Amazon Rekognition — image moderation
- **What:** AWS computer-vision / image-analysis service.
- **Why:** Automatic content moderation — no human reviewing every upload.
- **How:** On an S3 upload event, a Lambda calls Rekognition moderation labels;
  explicit/violent images are deleted so they're never served.

### 13. AWS CloudTrail — audit logging
- **What:** Records every API action in the AWS account.
- **Why:** A tamper-evident audit trail — who did what, when.
- **How:** A multi-region trail logs management events to a private S3 bucket.

### 14. Amazon GuardDuty — threat detection
- **What:** Continuous intelligent threat detection.
- **Why:** Early warning for suspicious activity, no agents to run.
- **How:** A detector analyzes CloudTrail, DNS, and network data and surfaces
  findings.

### 15. AWS IAM — permissions
- **What:** Identity and access management.
- **Why:** **Least privilege** — each component can only touch what it needs.
- **How:** Every Lambda has its own role granting only the specific tables/buckets
  it uses (read-only vs read-write).

### 16. Amazon CloudWatch — logs & metrics
- **What:** Logging and monitoring.
- **Why:** Debug and observe the system (used to find the Lambda-bundle crash and
  the CSP/CORS bugs during testing).
- **How:** Every Lambda auto-logs to CloudWatch; logs are read to diagnose issues.
  Four alarms (CloudFront 5xx rate, WAF blocked requests, HTTP API 5xx, Lambda
  errors) publish to an SNS topic that emails the owner, in `ConnectNest-Monitoring`.

---

## The 9 CDK stacks (separation of concerns)

| Stack | Owns |
|---|---|
| `ConnectNest-Data` | DynamoDB tables + GSIs |
| `ConnectNest-Auth` | Cognito user pool, Hosted UI, Google/Microsoft IdPs, MFA, SES email + custom-message trigger |
| `ConnectNest-Api` | HTTP API, JWT authorizer, Lambda handlers, S3 uploads, Rekognition moderation, IAM |
| `ConnectNest-Hosting` | CloudFront + private S3 SPA (OAC), WAF, ACM cert, `/api` routing |
| `ConnectNest-Security` | CloudTrail + GuardDuty |
| `ConnectNest-Monitoring` | CloudWatch alarms + SNS email alerts |
| `ConnectNest-Email` | SES domain identity + DKIM |
| `ConnectNest-Dns` | Route 53 hosted zone (apex ALIAS to CloudFront, DKIM/SPF/ACM records) |
| `ConnectNest-Realtime` | WebSocket API + Connections table + connect/disconnect/broadcast Lambdas |

---

## Likely Q&A answers

- **"Why serverless?"** → Scales to zero, costs cents at this scale, nothing to
  patch, all reproducible as code.
- **"Is it secure?"** → Defense-in-depth: JWT on every route, least-privilege IAM,
  WAF at the edge, content moderation, self-service authenticator-app MFA, security headers, CloudWatch alarms, CloudTrail audit + GuardDuty
  detection. (Never say "unhackable.")
- **"How does real-time work?"** → API Gateway WebSocket API; a broadcast Lambda
  pushes new posts/events to connected clients. Polling is the documented fallback.
- **"What would you change for production scale?"** → DynamoDB provisioned capacity
  + autoscaling, caching, CloudFront access logging, and the KMS customer-managed
  keys + VPC pieces deliberately deferred (documented conscious decisions).
- **"What was hardest?"** → WebSocket auth (token verified as a query param in a
  Lambda authorizer, since browsers can't send an auth header on a socket), and
  deploy-only bugs (a CSP blocking the `wss://` scheme, an S3 CORS gap blocking
  uploads) — "it builds" is not "it works."
