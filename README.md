# ConnectNest

A serverless campus engagement platform on AWS. React SPA on an explicit,
Infrastructure-as-Code backend: **Cognito + API Gateway (HTTP API) + Lambda +
DynamoDB**, all defined with the **AWS CDK**.

This project deliberately uses explicit CDK rather than a managed abstraction so
the cloud architecture is visible and reproducible.

## Repository layout

```
connectnest/
├── package.json        root — esbuild for CDK Lambda bundling
├── infra/              AWS CDK (TypeScript)
│   ├── bin/app.ts      composes the stacks
│   └── lib/
│       ├── data-stack.ts   DynamoDB tables
│       ├── auth-stack.ts   Cognito user pool + web client
│       └── api-stack.ts    HTTP API + Lambdas + JWT authorizer + IAM + S3
├── backend/            Lambda handlers (Node ESM, AWS SDK v3)
│   ├── shared/         db.ts, http.ts
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
Users → Cognito (auth)
      → API Gateway (HTTP API v2, Cognito JWT authorizer)
      → Lambda (per-feature handlers)
      → DynamoDB (one table per entity)
      + S3 (presigned uploads)
```

- Authentication is delegated to **Amazon Cognito** (no hand-rolled JWT).
- Every protected route is guarded by a **Cognito JWT authorizer**.
- Each Lambda gets only the DynamoDB/S3 permissions it needs (least privilege).
- User identity always comes from the **verified JWT claims**, never the request body.

See [docs/architecture.md](docs/architecture.md) and
[docs/data-model.md](docs/data-model.md).

## Prerequisites

- Node.js 20+
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
(cd backend && npx tsc --noEmit)     # typecheck Lambda handlers
(cd infra   && npx cdk synth)        # synthesize CloudFormation + bundle Lambdas
(cd frontend && CI=true npm run build)  # compile the SPA
```

## Deploy

Deploying creates real (near-free-tier) AWS resources that bill until destroyed.

```bash
cd infra
npx cdk bootstrap        # one-time per account/region
npx cdk deploy --all     # note the UserPoolId, UserPoolClientId, ApiUrl outputs
```

Wire the outputs into the frontend (`frontend/.env`, see `frontend/.env.example`):

```
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=...
REACT_APP_USER_POOL_CLIENT_ID=...
REACT_APP_API_URL=https://xxxx.execute-api.us-east-1.amazonaws.com
```

Run the frontend:

```bash
cd frontend && npm start   # http://localhost:3000
```

## Tear down

```bash
cd infra && npx cdk destroy --all
```

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

- A "my memberships" query (GroupMembers `byUser` GSI) so joined groups persist
  across sessions.
- S3 read/list/delete endpoints for viewing uploaded avatars/images/files.
- Tighten API and S3 CORS from `*` to the deployed frontend origin.
```
