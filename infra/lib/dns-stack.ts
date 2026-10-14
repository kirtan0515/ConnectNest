import { Stack, StackProps, CfnOutput, Duration, Fn } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  HostedZone,
  ARecord,
  AaaaRecord,
  CnameRecord,
  TxtRecord,
  RecordTarget,
  IAliasRecordTarget,
  IRecordSet,
  IHostedZone,
  AliasRecordTargetConfig,
} from "aws-cdk-lib/aws-route53";

/**
 * DnsStack — Route 53 public hosted zone for connectnestapp.com.
 *
 * Purely additive: it moves DNS authority off Namecheap so the apex can ALIAS
 * directly to the existing CloudFront distribution (apex ALIAS is impossible
 * with a plain CNAME at Namecheap), while replicating every live record so
 * email (SES DKIM) and certificate renewal (ACM validation) keep working
 * across the cutover. Synth only — this stack does NOT deploy and does NOT
 * change any nameserver.
 *
 * Alias-target choice: a minimal manual `IAliasRecordTarget` rather than
 * `Distribution.fromDistributionAttributes` + `CloudFrontTarget`. The latter
 * requires a `distributionId`, which we do not have — we only know the
 * distribution's domain name (`d30cmcivj0015i.cloudfront.net`). The manual
 * target needs only the two values we actually have (the CloudFront domain and
 * CloudFront's fixed global alias hosted-zone id `Z2FDTNDATAQYW2`, the same
 * value exposed as `CloudFrontTarget.CLOUDFRONT_ZONE_ID`), introduces no
 * cross-stack reference and no context lookup, and stays deterministic at synth.
 */

// CloudFront distribution domain (from the existing ConnectNest-Hosting dist).
const CLOUDFRONT_DOMAIN = "d30cmcivj0015i.cloudfront.net";
// CloudFront's fixed global hosted-zone id for alias targets (never changes).
const CLOUDFRONT_ZONE_ID = "Z2FDTNDATAQYW2";

/**
 * Minimal alias target pointing at the CloudFront distribution by domain name.
 * Avoids needing the (unknown) CloudFront distribution ID.
 */
class CloudFrontAliasTarget implements IAliasRecordTarget {
  bind(_record: IRecordSet, _zone?: IHostedZone): AliasRecordTargetConfig {
    return { dnsName: CLOUDFRONT_DOMAIN, hostedZoneId: CLOUDFRONT_ZONE_ID };
  }
}

export class DnsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const zone = new HostedZone(this, "Zone", {
      zoneName: "connectnestapp.com",
    });

    const cfTarget = RecordTarget.fromAlias(new CloudFrontAliasTarget());
    const ttl = Duration.minutes(30);

    // --- apex + www ALIAS records (A + AAAA). Alias records carry no TTL. ---
    new ARecord(this, "ApexA", { zone, target: cfTarget });
    new AaaaRecord(this, "ApexAaaa", { zone, target: cfTarget });
    new ARecord(this, "WwwA", { zone, recordName: "www", target: cfTarget });
    new AaaaRecord(this, "WwwAaaa", {
      zone,
      recordName: "www",
      target: cfTarget,
    });

    // --- 3 SES Easy-DKIM CNAMEs (recordName relative to the zone apex) ---
    new CnameRecord(this, "Dkim1", {
      zone,
      ttl,
      recordName: "ls4pn7snhgtege73rggm73zqwawkjbkr._domainkey",
      domainName: "ls4pn7snhgtege73rggm73zqwawkjbkr.dkim.amazonses.com",
    });
    new CnameRecord(this, "Dkim2", {
      zone,
      ttl,
      recordName: "erejolvgceub6ll2vig2ohqb5oove4um._domainkey",
      domainName: "erejolvgceub6ll2vig2ohqb5oove4um.dkim.amazonses.com",
    });
    new CnameRecord(this, "Dkim3", {
      zone,
      ttl,
      recordName: "xuytj32nvnw7n55ltkfxlmnvlxdewxzf._domainkey",
      domainName: "xuytj32nvnw7n55ltkfxlmnvlxdewxzf.dkim.amazonses.com",
    });

    // --- 2 ACM DNS-validation CNAMEs (apex cert + www cert) ---
    new CnameRecord(this, "AcmApex", {
      zone,
      ttl,
      recordName: "_277de2cdbb431f5ffd0f132b4cfd5670",
      domainName:
        "_1a1bb06805f4fb06d2115c4759624ede.wzccmgtwzk.acm-validations.aws.",
    });
    new CnameRecord(this, "AcmWww", {
      zone,
      ttl,
      recordName: "_524458dc93f8ce06b6643cb5df30cfee.www",
      domainName:
        "_876dbc4e36950ec8ea25a30ca0d994a3.wzccmgtwzk.acm-validations.aws.",
    });

    // --- SPF TXT at apex, replicated verbatim ---
    // This is Namecheap's email-forwarding SPF. Revisit after the nameserver
    // cutover: if the user wants outbound/forwarding via SES it should become
    // "v=spf1 include:amazonses.com ~all". Do NOT change it silently now —
    // replicated as-is to avoid a mail regression during the migration.
    new TxtRecord(this, "Spf", {
      zone,
      ttl,
      values: ["v=spf1 include:spf.efwd.registrar-servers.com ~all"],
    });

    // --- Outputs ---
    // hostedZoneNameServers is a string[] token at synth time; wrap in Fn.join
    // (a bare .join() would throw on an unresolved token). Guard with ?? [].
    new CfnOutput(this, "NameServers", {
      value: Fn.join(",", zone.hostedZoneNameServers ?? []),
    });
    new CfnOutput(this, "NameserverInstructions", {
      value:
        "Set these 4 nameservers at Namecheap (Domain List -> connectnestapp.com -> " +
        "Nameservers -> Custom DNS), replacing dns1/dns2.registrar-servers.com. " +
        "Propagation can take up to 24-48h. Email + cert validation records are " +
        "already replicated here.",
    });
  }
}
