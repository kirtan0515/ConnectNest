import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { EmailIdentity, Identity } from "aws-cdk-lib/aws-ses";

/**
 * EmailStack — Amazon SES domain identity for connectnestapp.com.
 *
 * Creates an SES domain identity with Easy DKIM (the default when no
 * `dkimIdentity` is supplied). Because the identity is created from a bare
 * domain string (no Route 53 hosted zone), CDK creates NO Route 53 records —
 * the user manages DNS manually at Namecheap Advanced DNS. The 3 generated
 * DKIM CNAME records are emitted as CfnOutputs to copy into Namecheap.
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
  }
}
