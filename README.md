# ConnectNest

A serverless campus engagement platform on AWS. A React SPA on an explicit,
Infrastructure-as-Code backend: **Cognito + API Gateway (HTTP API) + Lambda +
DynamoDB**, fronted by **CloudFront + AWS WAF**, all defined with the **AWS CDK**.

This project deliberately uses explicit CDK rather than a managed abstraction
(it was migrated off AWS Amplify) so the cloud architecture is visible,
reviewable, and reproducible.

## Repository layout

```
connectnest/
├── package.json        root — esbuild for CDK Lambda bundling
├── infra/              AWS CDK (TypeScript)
│   ├── bin/app.ts      composes the stacks
│   └── lib/
│       ├── data-stack.ts      DynamoDB tables + GSIs
│       ├── auth-stack.ts      Cognito user pool, Hosted UI, Google/Microsoft IdP, MFA
│       ├── api-stack.ts       HTTP API + Lambdas + JWT authorizer + IAM + S3
│       ├── hosting-stack.ts   CloudFront + S3 (OAC) SPA hosting + CloudFront WAF
│       └── security-stack.ts  CloudTrail + GuardDuty (account-wide detection)
├── backend/            Lambda handlers (Node 22 ESM, AWS SDK v3)
│   ├── shared/         db.ts, http.ts, account.ts, moderation.ts
│   └── handlers/       profiles, events, posts, groups, files
├── frontend/           React SPA (Create React App)
│   └── src/
│       ├── auth/        Cognito wrapper (amazon-cognito-identity-js) + context
│       ├── api/client.js  fetch wrapper with Cognito token
│       └── config.js    reads REACT_APP_* env vars
└── docs/               architecture.md, data-model.md
```

## Architecture

```
Users → CloudFront (HTTPS) + AWS WAF
      ├─ default →  S3 (private, OAC) — the React SPA
      └─ /api/*  →  API Gateway (HTTP API v2, Cognito JWT authorizer)
                 →  Lambda (per-feature handlers)
                 →  DynamoDB (one table per entity)
                 +  S3 (presigned uploads → Rekognition image moderation)

Auth: Amazon Cognito (email/password + Google/Microsoft via Hosted UI, optional MFA)
```

- Authentication is delegated to **Amazon Cognito** (no hand-rolled JWT), with
  email/password plus **Google** and **Microsoft** social login via the Hosted
  UI OAuth flow, and **optional TOTP MFA**.
- Every protected route is guarded by a **Cognito JWT authorizer**.
- Each Lambda gets only the DynamoDB/S3 permissions it needs (least privilege).
- User identity always comes from the **verified JWT claims**, never the request body.
- Public traffic is served through **CloudFront with an AWS WAF WebACL** (managed
  rule sets + rate limiting); the S3 origin is private (Origin Access Control).

See [docs/architecture.md](docs/architecture.md) and
[docs/data-model.md](docs/data-model.md).

## Prerequisites

- Node.js 20+ (Lambdas run on the Node 22 runtime)
- An AWS account and the AWS CLI configured (`aws configure`) for deploying
- Docker is **not** required — Lambda bundling runs locally via esbuild

## Install

Each package installs independently:

```bash
npm install                 # root (esbuild)
(cd backend  && npm install)
(cd infra    && npm install)
(cd frontend && npm install)
```

## Verify locally (no AWS resources created)

```bash
(cd backend && npx tsc --noEmit)        # typecheck Lambda handlers
(cd infra   && npx tsc --noEmit)        # typecheck CDK
(cd infra   && npx cdk synth)           # synthesize CloudFormation + bundle Lambdas
(cd frontend && CI=true npm run build)  # compile the SPA
```

## Deploy

Deploying creates real (near-free-tier) AWS resources that bill until destroyed.

Secrets and per-environment values (Google/Microsoft OAuth credentials, callback
URLs, allowed CORS origins) are supplied via CDK context in `infra/cdk.context.json`
(gitignored) — never committed. The Google OAuth client secret is stored in
**AWS Secrets Manager** and referenced dynamically, not baked into the template.

```bash
cd infra
npx cdk bootstrap        # one-time per account/region
npx cdk deploy --all     # note the UserPoolId, UserPoolClientId, ApiUrl outputs
```

The stacks deploy in dependency order: `Data` → `Auth` → `Api` → `Hosting`,
with `Security` independent.

Wire the outputs into the frontend (`frontend/.env`, see `frontend/.env.example`):

```
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=...
REACT_APP_USER_POOL_CLIENT_ID=...
REACT_APP_HOSTED_UI_DOMAIN=...
REACT_APP_API_URL=https://xxxx.execute-api.us-east-1.amazonaws.com
```

The production build (`frontend/.env.production`) leaves `REACT_APP_API_URL`
blank so the SPA calls the same-origin `/api` path, which CloudFront routes to
the HTTP API (no CORS in production).

Build and publish the SPA to CloudFront:

```bash
(cd frontend && npm run build)
(cd infra && npx cdk deploy ConnectNest-Hosting)   # uploads SPA + invalidates CDN
```

Run the frontend locally:

```bash
cd frontend && npm start   # http://localhost:3000
```

## Tear down

```bash
cd infra && npx cdk destroy --all
```

## Security

ConnectNest is built with defense-in-depth (see the handoff notes for the full
solution-architect writeup):

- **Edge**: CloudFront + AWS WAF (Common Rule Set, Known Bad Inputs, rate limit).
- **Auth**: Cognito JWT authorizer on every protected route; optional TOTP MFA;
  short token lifetimes; `preventUserExistenceErrors`.
- **Secrets**: Google OAuth secret in AWS Secrets Manager (dynamic reference).
- **Detection**: AWS CloudTrail (multi-region audit) + Amazon GuardDuty.
- **Storage**: private S3 buckets (BLOCK_ALL public access, SSE), presigned
  uploads constrained to an image allowlist and size cap.
- **Trust & safety**: server-side text block-list moderation on posts/comments/
  events/groups; Amazon Rekognition auto-moderation of uploaded images.
- **CORS**: locked to the known frontend origins (not `*`).
- **Account lifecycle**: deactivate / soft-delete with grace period / scheduled
  purge, with an audit log.

## API

All routes require a Cognito JWT (`Authorization: Bearer <idToken>`).

| Method | Path | Purpose |
|---|---|---|
| GET/PUT | `/profiles/me` | Get/update the current user's profile |
| GET | `/profiles/{userId}` | Get a user's profile |
| GET/POST | `/events` | List / create events |
| GET/PUT/DELETE | `/events/{eventId}` | Get / owner-update / owner-delete an event |
| POST | `/events/{eventId}/rsvp` | RSVP to an event (or cancel) |
| GET | `/events/{eventId}/rsvps` | List attendees for an event |
| GET | `/me/rsvps` | Events the current user has RSVP'd to |
| GET/POST | `/posts` | List / create posts (`?groupId=` filters) |
| DELETE | `/posts/{postId}` | Author-delete a post |
| POST | `/posts/{postId}/like` | Toggle like |
| GET/POST | `/posts/{postId}/comments` | List / add comments |
| GET/POST | `/groups` | List / create groups |
| POST | `/groups/{groupId}/join` | Join a group |
| POST | `/uploads/presign` | Get a presigned S3 upload URL |

## Known follow-ups

- Group authorization: enforce GroupMembers membership checks on group-scoped
  actions, plus a "my memberships" query so joined groups persist across sessions.
- S3 read endpoints (presigned GET) for displaying uploaded avatars/images.
- Comment delete/edit.
- Central activity dashboard and a recommendations feed.
- Real-time updates (currently polling).
- Finish Microsoft/Azure social login (button wired; needs Azure app credentials).
