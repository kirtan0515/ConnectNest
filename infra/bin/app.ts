#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import * as path from "path";
import * as fs from "fs";
import { DataStack } from "../lib/data-stack";
import { AuthStack } from "../lib/auth-stack";
import { ApiStack } from "../lib/api-stack";
import { HostingStack } from "../lib/hosting-stack";
import { SecurityStack } from "../lib/security-stack";

const app = new App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
};

// Account-level security observability (CloudTrail + GuardDuty).
new SecurityStack(app, "ConnectNest-Security", { env });

const data = new DataStack(app, "ConnectNest-Data", { env });
const auth = new AuthStack(app, "ConnectNest-Auth", { env });

const api = new ApiStack(app, "ConnectNest-Api", {
  env,
  userPool: auth.userPool,
  userPoolClient: auth.userPoolClient,
  tables: {
    profiles: data.profilesTable,
    events: data.eventsTable,
    rsvps: data.rsvpsTable,
    posts: data.postsTable,
    comments: data.commentsTable,
    postLikes: data.postLikesTable,
    groups: data.groupsTable,
    groupMembers: data.groupMembersTable,
    auditLog: data.auditLogTable,
  },
});

// Hosting (CloudFront + WAF + SPA). CLOUDFRONT-scoped WAF requires us-east-1.
// Only attach the SPA build if it exists so `cdk synth` works pre-build.
const spaBuild = path.join(__dirname, "..", "..", "frontend", "build");
new HostingStack(app, "ConnectNest-Hosting", {
  env: { account: env.account, region: "us-east-1" },
  crossRegionReferences: true,
  apiDomain: api.apiDomain,
  spaSourcePath: fs.existsSync(spaBuild) ? spaBuild : undefined,
});

app.synth();
