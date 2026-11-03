# ConnectNest — Transition & Operations Plan

This document is for whoever inherits ConnectNest next: a future student team, or
the Harrisburg University Office of Student Engagement if it decides to adopt the
project. It explains what the platform is made of, how to run and change it, what
it costs, what is blocked on the institution, and how to move it into an official
university AWS account.

It deliberately contains **no secrets or account numbers**. Those live in the
places noted below (AWS, the DNS registrar, and a local, gitignored handoff file).

---

## 1. What ConnectNest is

A serverless campus-engagement web app for Harrisburg University: profiles,
events with RSVPs, posts with likes and comments, groups, an activity feed,
image uploads with moderation, real-time updates, and in-app notifications.

- **Frontend:** React single-page app (Vite), served as static files.
- **Backend + infrastructure:** defined entirely as code with the AWS CDK
  (TypeScript), deployed to **us-east-1** across **9 stacks**.
- **Live at:** https://connectnestapp.com

Because everything is infrastructure-as-code, the whole platform can be torn
down and recreated in another AWS account from this repository.

---

## 2. Ownership checklist (what must change hands)

A real transition means transferring control of these. The code is the easy part.

| Asset | Where it lives | Notes |
|---|---|---|
| AWS account | AWS (account root + IAM) | Holds all 9 stacks. See §6 to migrate to a new account. |
| Domain `connectnestapp.com` | Domain registrar + Route 53 | Registrar login and the Route 53 hosted zone. |
| Cognito user pool | AWS (`ConnectNest-Auth`) | Contains real user accounts. Migration = user re-signup unless exported. |
| Google OAuth client | Google Cloud console | Client ID is public; the secret is in Secrets Manager / CDK context. |
| Microsoft OAuth app | Microsoft Entra (Azure) tenant | Currently a personal tenant (see §5). |
| SES production access | AWS (`ConnectNest-Email`) | Production sending is already approved for this account. |
| GitHub repository | github.com/kirtan0515/ConnectNest | Public. Transfer or fork. |
| Alarm email subscription | SNS (`ConnectNest-Monitoring`) | Confirm the new owner's address (see §4). |

Local-only operational notes (not in the repo, by design) live in `HANDOFF.md`
on the current maintainer's machine. Ask for it during handoff.

---

## 3. Stack inventory

Deploy/update order matters only for Email -> Auth (DKIM) and the cross-stack
references CDK resolves automatically.

| Stack | Owns |
|---|---|
| `ConnectNest-Data` | DynamoDB tables (one per entity, on-demand billing) + GSIs |
| `ConnectNest-Auth` | Cognito user pool, Hosted UI, Google + Microsoft IdPs, optional TOTP MFA, custom-message email trigger |
| `ConnectNest-Api` | HTTP API, Cognito JWT authorizer, Lambda handlers, S3 uploads bucket, Rekognition moderation, scheduled account purge |
| `ConnectNest-Realtime` | WebSocket API ($connect authorizer, $disconnect, $default), connections table |
| `ConnectNest-Hosting` | CloudFront + private S3 SPA (OAC), WAF, ACM cert, `/api` routing, security headers |
| `ConnectNest-Email` | SES domain identity with DKIM |
| `ConnectNest-Dns` | Route 53 hosted zone (apex ALIAS to CloudFront, DKIM/SPF/ACM records) |
| `ConnectNest-Security` | CloudTrail audit trail + GuardDuty |
| `ConnectNest-Monitoring` | CloudWatch alarms (CloudFront 5xx, WAF blocks, API 5xx, Lambda errors) -> SNS email |

See [architecture.md](architecture.md), [aws-services.md](aws-services.md), and
[data-model.md](data-model.md) for detail.

---

## 4. Running it day to day

### Prerequisites
- Node.js 20+, the AWS CLI configured for the target account/region, and CDK.

### Local development
```bash
(cd frontend && npm install && npm run dev)   # http://localhost:3000
(cd backend  && npm test)                      # unit tests
(cd frontend && npm test)                      # unit tests
```

### Deploy (manual)
CI only verifies the code; deploys are manual on purpose (they change live infra).

```bash
cd infra
npx cdk bootstrap                 # one time per account/region
# Email first if DKIM is not yet set up; otherwise order is automatic.
npx cdk deploy --all --require-approval never
```

Publish a new frontend:
```bash
(cd frontend && npm run build)
(cd infra && npx cdk deploy ConnectNest-Hosting)
```

Alarm emails (the address is a deploy-time value, never committed):
```bash
(cd infra && npx cdk deploy ConnectNest-Monitoring -c alertEmail=you@example.com)
```
Then click **Confirm subscription** in the email AWS sends.

### Deploy from CI
`.github/workflows/deploy.yml` is a manual (workflow_dispatch) job. Set the repo
secret `AWS_ROLE_ARN` to a role GitHub can assume via OIDC, then run it from the
Actions tab.

### Rollback
- CloudFormation rolls a failed `cdk deploy` back automatically.
- To revert a bad frontend, redeploy `ConnectNest-Hosting` from a previous commit
  (rebuild the SPA from that commit first). CloudFront invalidation is automatic.
- To revert a bad handler, redeploy `ConnectNest-Api` from a previous commit.

### Health check
```bash
python3 scripts/smoke-test.py     # 28 checks against the deployed stack
```

---

## 5. Blocked on the institution (cannot be done from code)

These need Harrisburg University IT/administration and are the main reasons the
project isn't "fully institutional" yet:

- **Organizational Microsoft sign-in.** Microsoft login currently runs through a
  personal Entra tenant and works for personal Microsoft accounts. Letting
  students sign in with their `@harrisburgu.edu` identities needs the project
  registered as an app in HU's own Entra tenant, approved by HU IT.
- **Canvas (LMS) integration.** Auto-populating study groups from a student's
  real course schedule needs Canvas API / LTI credentials from HU. This is the
  single highest-value institutional integration (see roadmap in the README).
- **Email domain.** Production email currently sends from `connectnestapp.com`.
  An institutional deployment may prefer an HU-owned subdomain, which means new
  SES identity + DKIM records in HU DNS.

---

## 6. Moving to an official university AWS account

The repo is account-agnostic; CDK reads the target account/region from the
environment at deploy time. To stand ConnectNest up in a new (HU) account:

1. Create/choose the AWS account and an IAM principal with deploy permissions.
2. Register (or transfer) a domain and create a Route 53 hosted zone, or adapt
   `ConnectNest-Dns` to the HU domain. Update the nameservers at the registrar.
3. Recreate the third-party identity providers for the new environment:
   - A Google OAuth client (redirect URIs for the new Hosted UI domain).
   - A Microsoft Entra app (ideally in HU's tenant — see §5).
   - Put their secrets in the gitignored CDK context / Secrets Manager; never in
     git.
4. `cdk bootstrap`, then `cdk deploy ConnectNest-Email`, add the DKIM records,
   wait for SES verification, and request SES production access for the new
   account.
5. `cdk deploy --all`, then build and deploy the SPA.
6. Point the domain's apex at the new CloudFront distribution (Route 53 ALIAS).

**User data note:** Cognito users and DynamoDB data do not move automatically.
Plan either a clean start (students re-register) or an explicit export/import of
the Cognito pool and tables during a maintenance window.

---

## 7. Cost model

Everything is serverless and billed on demand, so idle cost is low and the bill
tracks real usage:

- **Scales to zero:** Lambda, API Gateway, and DynamoDB (on-demand) cost
  effectively nothing when no one is using the app.
- **Roughly fixed monthly items:** the Route 53 hosted zone, domain renewal, and
  low-volume CloudWatch/CloudTrail/GuardDuty.
- **Grows with usage:** Lambda invocations, DynamoDB read/write units, S3 storage
  for uploads, and CloudFront egress.

At capstone/demo traffic this is a small monthly figure. Before heavy adoption,
revisit the global-feed reads (today a DynamoDB Scan) — moving them onto the
existing GSIs and adding short CloudFront caching on read endpoints controls both
latency and cost before reaching for DAX or ElastiCache.

---

## 8. Known operational notes

- **Cold starts:** Node.js 22 Lambdas bundled small with esbuild; cold starts are
  typically a few hundred ms. If low-traffic latency ever matters, provisioned
  concurrency on the user-facing handlers is the lever (at the cost of
  always-on spend — weigh it against scale-to-zero).
- **Moderation:** text is a server-side block-list; images are scanned by
  Rekognition on upload. Both are server-side and cannot be bypassed from the
  client. Amazon Comprehend is the documented upgrade path for nuanced text.
- **Account lifecycle:** deleted accounts have a 30-day grace window; a daily
  EventBridge-scheduled Lambda hard-deletes expired ones.
- **Tests + CI:** backend and frontend unit tests run in GitHub Actions on every
  push/PR, alongside a CDK synth. `scripts/smoke-test.py` is the end-to-end check
  against a live stack.
