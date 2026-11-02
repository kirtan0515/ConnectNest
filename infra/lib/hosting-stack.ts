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
  ResponseHeadersPolicy,
  HeadersFrameOption,
  HeadersReferrerPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin, HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import {
  Function as CfFunction,
  FunctionCode,
  FunctionEventType,
} from "aws-cdk-lib/aws-cloudfront";
import { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";

export interface HostingStackProps extends StackProps {
  /** Bare API host, e.g. abc.execute-api.us-east-1.amazonaws.com */
  apiDomain: string;
  /** Path to the built SPA (frontend/build). */
  spaSourcePath?: string;
  /**
   * Custom domains to attach to the CloudFront distribution (apex + www).
   * When provided and non-empty, a DNS-validated ACM certificate is created
   * and the distribution is configured with these aliases. When
   * absent/empty, no certificate or aliases are added and the synthesized
   * template is byte-for-byte identical to the default (no custom domain).
   */
  domainNames?: string[];
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

    // ---- Optional custom domain + DNS-validated ACM certificate ----
    // Gated on props.domainNames. When absent/empty, neither `domainNames`
    // nor `certificate` is passed to the Distribution, so synth is unchanged.
    // The L2 Certificate must live in us-east-1 for CloudFront; this stack is
    // already pinned there (see bin/app.ts), so a plain Certificate is correct.
    const hasDomains = !!props.domainNames && props.domainNames.length > 0;
    const certificate = hasDomains
      ? new Certificate(this, "SiteCert", {
          domainName: props.domainNames![0],
          subjectAlternativeNames: props.domainNames!.slice(1),
          validation: CertificateValidation.fromDns(),
        })
      : undefined;
    const aliasProps = hasDomains
      ? { domainNames: props.domainNames, certificate }
      : {};

    // Browser security headers on every response. The CSP stays in the
    // index.html meta tag; these cover what a meta tag cannot (HSTS, framing).
    const securityHeaders = new ResponseHeadersPolicy(this, "SecurityHeaders", {
      securityHeadersBehavior: {
        strictTransportSecurity: {
          accessControlMaxAge: Duration.days(365),
          includeSubdomains: true,
          preload: false,
          override: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: HeadersFrameOption.DENY, override: true },
        referrerPolicy: {
          referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
      },
      customHeadersBehavior: {
        customHeaders: [
          {
            header: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
            override: true,
          },
        ],
      },
    });

    const distribution = new Distribution(this, "Cdn", {
      ...aliasProps,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: securityHeaders,
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

    // ---- Custom-domain outputs (only when domains are attached) ----
    if (hasDomains) {
      new CfnOutput(this, "AcmValidationInstruction", {
        value:
          "Open the ACM console in us-east-1, select the 'SiteCert' certificate, " +
          "copy the single CNAME validation record (name + value), and add it as a " +
          "CNAME in Namecheap Advanced DNS. The record is not output here because the " +
          "L2 Certificate does not expose it at synth time.",
      });
      new CfnOutput(this, "AliasTarget", {
        value: distribution.distributionDomainName,
      });
      new CfnOutput(this, "SiteDomains", {
        value: props.domainNames!.join(", "),
      });
    }
  }
}
