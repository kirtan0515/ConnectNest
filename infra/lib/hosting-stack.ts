import {
  Stack,
  StackProps,
  RemovalPolicy,
  Duration,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Bucket,
  BlockPublicAccess,
  BucketEncryption,
} from "aws-cdk-lib/aws-s3";
import {
  Distribution,
  ViewerProtocolPolicy,
  AllowedMethods,
  CachePolicy,
  OriginRequestPolicy,
  OriginProtocolPolicy,
  CachedMethods,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin, HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import {
  Function as CfFunction,
  FunctionCode,
  FunctionEventType,
} from "aws-cdk-lib/aws-cloudfront";
import { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";

export interface HostingStackProps extends StackProps {
  /** Bare API host, e.g. abc.execute-api.us-east-1.amazonaws.com */
  apiDomain: string;
  /** Path to the built SPA (frontend/build). */
  spaSourcePath?: string;
}

/**
 * HostingStack — public entry point for ConnectNest.
 *
 *   CloudFront (WAF-protected, HTTPS)
 *     ├─ default behavior  → S3 (React SPA)
 *     └─ /api/*            → HTTP API origin (JWT-authorized)
 *
 * Serving SPA + API from one origin removes CORS entirely and lets WAF protect
 * the whole app. WAF for CloudFront must be CLOUDFRONT scope in us-east-1.
 */
export class HostingStack extends Stack {
  constructor(scope: Construct, id: string, props: HostingStackProps) {
    super(scope, id, props);

    // ---- SPA bucket (private; served only via CloudFront OAC) ----
    const siteBucket = new Bucket(this, "SpaBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ---- CLOUDFRONT-scoped WAF (managed rules + rate limit) ----
    const webAcl = new CfnWebACL(this, "CdnWebAcl", {
      name: "connectnest-cdn-waf",
      scope: "CLOUDFRONT",
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "connectnest-cdn-waf",
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: "CommonRuleSet",
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "common-rule-set",
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "KnownBadInputs",
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesKnownBadInputsRuleSet",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "known-bad-inputs",
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "RateLimitPerIp",
          priority: 3,
          action: { block: {} },
          statement: {
            rateBasedStatement: { limit: 2000, aggregateKeyType: "IP" },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "rate-limit",
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // ---- API origin: forward /api/* to the HTTP API, stripping the prefix ----
    const apiOrigin = new HttpOrigin(props.apiDomain, {
      protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
    });

    // Viewer-request function: rewrite "/api/events" -> "/events" so the HTTP
    // API (which has no /api prefix) receives the correct path.
    const stripApiPrefix = new CfFunction(this, "StripApiPrefix", {
      code: FunctionCode.fromInline(
        "function handler(event){var r=event.request;r.uri=r.uri.replace(/^\\/api/,'');if(r.uri==='')r.uri='/';return r;}"
      ),
    });

    const distribution = new Distribution(this, "Cdn", {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        "/api/*": {
          origin: apiOrigin,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          cachedMethods: CachedMethods.CACHE_GET_HEAD,
          // Don't cache API responses; forward auth + all query strings.
          cachePolicy: CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          functionAssociations: [
            {
              function: stripApiPrefix,
              eventType: FunctionEventType.VIEWER_REQUEST,
            },
          ],
        },
      },
      defaultRootObject: "index.html",
      // SPA client-side routing: serve index.html for unknown paths.
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(5),
        },
      ],
      webAclId: webAcl.attrArn,
      comment: "ConnectNest SPA + API",
    });

    // ---- Deploy the built SPA (if present) ----
    // Expects frontend/build to exist. Invalidates the cache on deploy.
    if (props.spaSourcePath) {
      new BucketDeployment(this, "DeploySpa", {
        sources: [Source.asset(props.spaSourcePath)],
        destinationBucket: siteBucket,
        distribution,
        distributionPaths: ["/*"],
      });
    }

    new CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`,
    });
    new CfnOutput(this, "CdnWebAclArn", { value: webAcl.attrArn });
  }
}
