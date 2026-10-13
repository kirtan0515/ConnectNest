# ConnectNest — Architecture

ConnectNest is a serverless campus engagement platform. The frontend is a React
single-page app; the backend is defined entirely as code with the AWS CDK.

## Diagram

```
                    ┌─────────────┐
   Users ──────────▶│  S3 + CDN   │   React static build (Weeks 13–14)
                    └──────┬──────┘
                           │  auth + API calls (JWT)
              ┌────────────┼─────────────┐
              ▼                           ▼
     ┌─────────────┐            ┌──────────────────┐
     │   Cognito   │            │   API Gateway    │
     │  User Pool  │◀──authorize│  (HTTP API v2)   │
     └─────────────┘            └────────┬─────────┘
                                         │  (Cognito JWT authorizer)
                                  ┌──────▼──────┐
                                  │   Lambda    │   business logic
                                  │  handlers   │   (profiles, events,
                                  └──────┬──────┘    posts, groups, files)
                                         │
                          ┌──────────────┴───────────────┐
                          ▼                               ▼
                   ┌─────────────┐                 ┌─────────────┐
                   │  DynamoDB   │                 │     S3      │
                   │ (per-entity │                 │  uploads    │
                   │   tables)   │                 │ (presigned) │
                   └─────────────┘                 └─────────────┘
```

## Stacks (CDK)

| Stack | Contents |
|---|---|
| `ConnectNest-Data` | 8 DynamoDB tables (see data-model.md), on-demand billing |
| `ConnectNest-Auth` | Cognito user pool + public web client |
| `ConnectNest-Api` | HTTP API, Cognito JWT authorizer, Lambda handlers, IAM, S3 uploads bucket |

## Services

| Layer | Service | Responsibility |
|---|---|---|
| Auth | Amazon Cognito | Sign-up, sign-in, tokens, password policy, recovery |
| API | API Gateway (HTTP API v2) | Public entry; validates the Cognito JWT before routing |
| Compute | AWS Lambda (Node 22, ARM64) | Stateless business logic per feature |
| Data | Amazon DynamoDB | Profiles, events, posts, comments, likes, groups |
| Storage | Amazon S3 | User uploads via presigned URLs |
| Identity | IAM | Least-privilege role per Lambda |
| Observability | CloudWatch | Logs and metrics |

## Security principles

- Authentication delegated to Cognito — no custom password/JWT handling.
- Every protected route sits behind a Cognito JWT authorizer.
- Handlers derive the user id from the verified JWT claim
  (`event.requestContext.authorizer.jwt.claims.sub`), never from the body.
  Owner-only mutations verify `ownerId === userId`.
- Each Lambda receives only the table/bucket permissions it needs
  (read-only vs read-write) via CDK `grant*` calls.
- No secrets or backend libraries are shipped in the frontend bundle.

## Frontend integration

- `amazon-cognito-identity-js` handles the Cognito flows, isolated in
  `frontend/src/auth/auth.js` so the library is swappable.
- `AuthContext` exposes the signed-in user and auth actions to the app.
- `api/client.js` attaches the Cognito id token as a Bearer credential on
  every request and points at the API base URL from `config.js`.
- Real-time features (event feed, chat) use polling rather than subscriptions.
