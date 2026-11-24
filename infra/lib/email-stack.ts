import {
  Stack,
  StackProps,
  CfnOutput,
  Duration,
  RemovalPolicy,
} from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import {
  EmailIdentity,
  Identity,
  ReceiptRuleSet,
} from "aws-cdk-lib/aws-ses";
import * as actions from "aws-cdk-lib/aws-ses-actions";
import {
  Bucket,
  BlockPublicAccess,
  BucketEncryption,
} from "aws-cdk-lib/aws-s3";
import { Runtime, Architecture } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from "aws-cdk-lib/custom-resources";

const REPO_ROOT = path.join(__dirname, "..", "..");
const BACKEND_DIR = path.join(REPO_ROOT, "backend");
const DEPS_LOCK = path.join(BACKEND_DIR, "package-lock.json");

const DOMAIN = "connectnestapp.com";
/** Addresses the receipt rule accepts. Anything else is rejected by SES. */
const INBOUND_RECIPIENTS = [`support@${DOMAIN}`, `abuse@${DOMAIN}`];
/** Sender of forwarded copies (keeps SPF/DKIM/DMARC aligned with the domain). */
const FORWARD_FROM = `no-reply@${DOMAIN}`;
/** Raw inbound messages are deleted from S3 after this many days. */
const INBOUND_RETENTION_DAYS = 30;
const INBOUND_PREFIX = "inbound/";

/**
 * EmailStack — Amazon SES domain identity for connectnestapp.com.
 *
 * Creates an SES domain identity with Easy DKIM (the default when no
 * `dkimIdentity` is supplied). Because the identity is created from a bare
 * domain string (no Route 53 hosted zone), CDK creates NO Route 53 records —
 * the user manages DNS manually at Namecheap Advanced DNS. The 3 generated
 * DKIM CNAME records are emitted as CfnOutputs to copy into Namecheap.
 *
 * Inbound mail: SES email receiving accepts support@ and abuse@ (spam/virus
 * scanned), stores the raw message in a private encrypted S3 bucket (30-day
 * expiry) and invokes a Lambda that forwards it to the address in CDK context
 * `inboundForwardTo` (never in git). Without that context the bucket is still
 * created, but the forwarder, receipt rule set and its activation are skipped
 * so `cdk synth` works in CI. The MX and SPF records live in ConnectNest-Dns.
 *
 * NOTE: SES starts in SANDBOX mode (can only send to verified identities)
 * until production access is requested from AWS. A custom MAIL FROM domain is
 * optional and intentionally skipped here (no MX/TXT/Route 53 records needed).
 */
export class EmailStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Easy DKIM is the default — do NOT pass `dkimIdentity`. Identity.domain()
    // carries no hostedZone, so zero Route 53 resources are created.
    const identity = new EmailIdentity(this, "ConnectNestAppDomain", {
      identity: Identity.domain("connectnestapp.com"),
    });

    // The 3 DKIM CNAME records to add manually at Namecheap Advanced DNS.
    new CfnOutput(this, "DkimCname1Name", {
      value: identity.dkimDnsTokenName1,
    });
    new CfnOutput(this, "DkimCname1Value", {
      value: identity.dkimDnsTokenValue1,
    });
    new CfnOutput(this, "DkimCname2Name", {
      value: identity.dkimDnsTokenName2,
    });
    new CfnOutput(this, "DkimCname2Value", {
      value: identity.dkimDnsTokenValue2,
    });
    new CfnOutput(this, "DkimCname3Name", {
      value: identity.dkimDnsTokenName3,
    });
    new CfnOutput(this, "DkimCname3Value", {
      value: identity.dkimDnsTokenValue3,
    });

    new CfnOutput(this, "DnsInstructions", {
      value:
        "Add these 3 CNAME records at Namecheap Advanced DNS for connectnestapp.com, then wait for SES domain verification before deploying ConnectNest-Auth.",
    });

    // ---- Inbound mail (SES email receiving) ----
    const inboundBucket = new Bucket(this, "InboundMailBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      // Mail is user data: keep the bucket if the stack is ever deleted.
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [{ expiration: Duration.days(INBOUND_RETENTION_DAYS) }],
    });
    new CfnOutput(this, "InboundMailBucketName", {
      value: inboundBucket.bucketName,
    });

    const forwardTo = (
      this.node.tryGetContext("inboundForwardTo") as string | undefined
    )?.trim();
    if (!forwardTo) return;
    if (!/^[^\s@,;<>"]+@[^\s@,;<>"]+$/.test(forwardTo)) {
      throw new Error("inboundForwardTo must be a single email address");
    }

    const forwardFn = new NodejsFunction(this, "ForwardInboundFn", {
      entry: path.join(BACKEND_DIR, "handlers/email/forwardInbound.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 512,
      timeout: Duration.seconds(30),
      projectRoot: REPO_ROOT,
      depsLockFilePath: DEPS_LOCK,
      environment: {
        BUCKET_NAME: inboundBucket.bucketName,
        KEY_PREFIX: INBOUND_PREFIX,
        FROM_ADDRESS: FORWARD_FROM,
        FORWARD_TO: forwardTo,
      },
      bundling: {
        format: OutputFormat.ESM,
        minify: true,
        target: "node22",
        externalModules: ["@aws-sdk/client-s3"],
      },
    });
    // Least privilege: read only inbound objects; send only as the no-reply
    // address from this domain identity.
    inboundBucket.grantRead(forwardFn, `${INBOUND_PREFIX}*`);
    forwardFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["ses:SendEmail"],
        resources: [
          this.formatArn({
            service: "ses",
            resource: "identity",
            resourceName: DOMAIN,
          }),
        ],
        conditions: { StringEquals: { "ses:FromAddress": FORWARD_FROM } },
      }),
    );

    const ruleSet = new ReceiptRuleSet(this, "InboundRuleSet", {
      receiptRuleSetName: "connectnest-inbound",
    });
    const rule = ruleSet.addRule("SupportAndAbuse", {
      recipients: INBOUND_RECIPIENTS,
      scanEnabled: true,
      enabled: true,
      actions: [
        new actions.S3({
          bucket: inboundBucket,
          objectKeyPrefix: INBOUND_PREFIX,
        }),
        new actions.Lambda({
          function: forwardFn,
          invocationType: actions.LambdaInvocationType.EVENT,
        }),
      ],
    });

    // A rule set only takes effect once it is the account's active set.
    // On delete, deactivate so the rule set can be removed.
    const setActive = (name?: string) => ({
      service: "SES",
      action: "setActiveReceiptRuleSet",
      parameters: name ? { RuleSetName: name } : {},
      physicalResourceId: PhysicalResourceId.of("connectnest-active-rule-set"),
    });
    const activate = new AwsCustomResource(this, "ActivateInboundRuleSet", {
      onCreate: setActive(ruleSet.receiptRuleSetName),
      onUpdate: setActive(ruleSet.receiptRuleSetName),
      onDelete: setActive(),
      installLatestAwsSdk: false,
      policy: AwsCustomResourcePolicy.fromStatements([
        new PolicyStatement({
          actions: ["ses:SetActiveReceiptRuleSet"],
          resources: ["*"],
        }),
      ]),
    });
    activate.node.addDependency(rule);
  }
}
