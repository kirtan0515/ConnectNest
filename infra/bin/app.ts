#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import * as path from "path";
import * as fs from "fs";
import { DataStack } from "../lib/data-stack";
import { AuthStack } from "../lib/auth-stack";
import { ApiStack } from "../lib/api-stack";
import { RealtimeStack } from "../lib/realtime-stack";
import { HostingStack } from "../lib/hosting-stack";
import { SecurityStack } from "../lib/security-stack";
import { EmailStack } from "../lib/email-stack";
import { DnsStack } from "../lib/dns-stack";

const app = new App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
};

// Account-level security observability (CloudTrail + GuardDuty).
new SecurityStack(app, "ConnectNest-Security", { env });

// Amazon SES domain identity for branded transactional email. Deploy FIRST,
// add the emitted DKIM CNAMEs at Namecheap, and wait for SES verification
// before deploying ConnectNest-Auth (which references this SES identity).
new EmailStack(app, "ConnectNest-Email", { env });

// Route 53 hosted zone for connectnestapp.com. Additive and standalone — moves
// DNS off Namecheap so the apex can ALIAS to CloudFront, and replicates all live
// records (DKIM, ACM validation, SPF). No deploy / nameserver change is implied
// by synth.
new DnsStack(app, "ConnectNest-Dns", { env });

const data = new DataStack(app, "ConnectNest-Data", { env });
const auth = new AuthStack(app, "ConnectNest-Auth", { env });

// Realtime push (WebSocket API + Connections table + lifecycle Lambdas).
// Instantiated before ApiStack so its references can be passed in; CDK orders
// the stacks from the construct references without a cycle.
const realtime = new RealtimeStack(app, "ConnectNest-Realtime", {
  env,
  userPool: auth.userPool,
  userPoolClientId: auth.userPoolClient.userPoolClientId,
});

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
  realtime: {
    connectionsTable: realtime.connectionsTable,
    webSocketApi: realtime.webSocketApi,
    managementEndpoint: realtime.managementEndpoint,
  },
});

// Hosting (CloudFront + WAF + SPA). CLOUDFRONT-scoped WAF requires us-east-1.
// Only attach the SPA build if it exists so `cdk synth` works pre-build.
const spaBuild = path.join(__dirname, "..", "..", "frontend", "build");
// Optional custom domains, e.g. -c siteDomains=connectnestapp.com,www.connectnestapp.com
const siteDomainsCtx = app.node.tryGetContext("siteDomains") as
  | string
  | undefined;
const siteDomains = siteDomainsCtx
  ? siteDomainsCtx
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : undefined;
new HostingStack(app, "ConnectNest-Hosting", {
  env: { account: env.account, region: "us-east-1" },
  crossRegionReferences: true,
  apiDomain: api.apiDomain,
  spaSourcePath: fs.existsSync(spaBuild) ? spaBuild : undefined,
  domainNames: siteDomains,
});

app.synth();
