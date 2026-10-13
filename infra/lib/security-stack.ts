import {
  Stack,
  StackProps,
  RemovalPolicy,
  Duration,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { Trail } from "aws-cdk-lib/aws-cloudtrail";
import { Bucket, BlockPublicAccess, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { CfnDetector } from "aws-cdk-lib/aws-guardduty";

/**
 * SecurityStack — account-level observability / threat detection.
 *
 *  - CloudTrail: immutable audit of every AWS API call (who did what, when),
 *    stored in a private, encrypted, lifecycle-managed S3 bucket.
 *  - GuardDuty: continuous ML threat detection over CloudTrail / VPC / DNS logs
 *    (flags credential misuse, anomalous API calls, crypto-mining, etc.).
 *
 * These are account/region singletons, kept out of the app stacks on purpose.
 */
export class SecurityStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ---- CloudTrail ----
    const trailBucket = new Bucket(this, "TrailBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [{ expiration: Duration.days(365) }],
    });

    new Trail(this, "AuditTrail", {
      trailName: "connectnest-audit-trail",
      bucket: trailBucket,
      isMultiRegionTrail: true,
      includeGlobalServiceEvents: true,
      enableFileValidation: true, // tamper-evident log file integrity
    });

    // ---- GuardDuty ----
    // Idempotency note: an account/region can have only ONE detector. If one
    // already exists, this will fail — enable via -c skipGuardDuty=true then.
    const skipGuardDuty =
      this.node.tryGetContext("skipGuardDuty") === "true";
    if (!skipGuardDuty) {
      const detector = new CfnDetector(this, "GuardDutyDetector", {
        enable: true,
        findingPublishingFrequency: "FIFTEEN_MINUTES",
      });
      new CfnOutput(this, "GuardDutyDetectorId", { value: detector.ref });
    }

    new CfnOutput(this, "TrailBucketName", { value: trailBucket.bucketName });
  }
}
