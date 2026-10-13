import {
  Stack,
  StackProps,
  RemovalPolicy,
  Duration,
  CfnOutput,
  SecretValue,
} from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import {
  UserPool,
  UserPoolClient,
  UserPoolClientIdentityProvider,
  UserPoolIdentityProviderGoogle,
  UserPoolIdentityProviderOidc,
  ProviderAttribute,
  VerificationEmailStyle,
  AccountRecovery,
  OAuthScope,
  Mfa,
  UserPoolEmail,
  UserPoolOperation,
} from "aws-cdk-lib/aws-cognito";
import { Runtime, Architecture } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

/** Repo root — handlers live in ../backend, outside infra/. */
const REPO_ROOT = path.join(__dirname, "..", "..");
const BACKEND_DIR = path.join(REPO_ROOT, "backend");
const DEPS_LOCK = path.join(BACKEND_DIR, "package-lock.json");
// Match api-stack: externalize only the core SDK clients the Node 22 runtime
// reliably ships. The custom-message handler imports none of these (only
// erased aws-lambda types), so this is harmless and keeps conventions aligned.
const CORE_SDK_EXTERNALS = [
  "@aws-sdk/client-dynamodb",
  "@aws-sdk/lib-dynamodb",
  "@aws-sdk/client-s3",
];

/**
 * AuthStack — Amazon Cognito user pool + public web client.
 *
 * Email/password sign-in (SRP) stays the default. This stack also adds a
 * Hosted UI domain and optional Google + Microsoft (Azure AD, via OIDC)
 * identity providers for "Sign in with ..." (OAuth redirect flow).
 *
 * Social providers are CONDITIONAL on secrets being supplied via CDK context,
 * so the stack still deploys before you register the OAuth apps:
 *   cdk deploy -c googleClientId=... -c googleClientSecret=... \
 *              -c msClientId=... -c msClientSecret=... -c msIssuer=...
 * (or put them under "context" in cdk.json). When absent, only the social
 * provider is skipped — everything else deploys normally.
 */
export class AuthStack extends Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ---- Custom Message trigger Lambda ----
    // Replaces Cognito's default plain-text verification/reset emails with
    // branded ConnectNest HTML, delivered via SES. Built with the same
    // NodejsFunction/esbuild conventions as api-stack. No table access and no
    // IAM beyond default logging; addTrigger wires the invoke permission.
    const customMessageFn = new NodejsFunction(this, "CustomMessageFn", {
      entry: path.join(BACKEND_DIR, "handlers/auth/customMessage.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 256,
      timeout: Duration.seconds(10),
      projectRoot: REPO_ROOT,
      depsLockFilePath: DEPS_LOCK,
      bundling: {
        format: OutputFormat.ESM,
        minify: true,
        target: "node22",
        externalModules: CORE_SDK_EXTERNALS,
      },
    });

    this.userPool = new UserPool(this, "UserPool", {
      userPoolName: "connectnest-users",
      // Branded transactional email via Amazon SES. The sender address lives on
      // the SES domain identity created in ConnectNest-Email.
      //
      // MANDATORY DEPLOY ORDER:
      //   1. deploy ConnectNest-Email (creates the SES domain identity)
      //   2. add the 3 emitted DKIM CNAME records at Namecheap Advanced DNS
      //   3. wait for SES domain verification (status "Verified")
      //   4. THEN deploy ConnectNest-Auth (this stack) and ConnectNest-Hosting
      //      (Hosting publishes the logo to CloudFront).
      // Deploying this stack with withSES before the SES identity is verified
      // fails — Cognito validates the referenced SES identity at deploy time.
      email: UserPoolEmail.withSES({
        fromEmail: "no-reply@connectnestapp.com",
        fromName: "ConnectNest",
        // Replies to the automated no-reply address are routed here. Set up a
        // free Namecheap email forwarder (support@connectnestapp.com -> your
        // inbox) so user replies with questions actually reach you.
        replyTo: "support@connectnestapp.com",
        sesVerifiedDomain: "connectnestapp.com",
        sesRegion: "us-east-1",
      }),
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      // MFA available (optional) via authenticator-app TOTP — works on the
      // Essentials tier. NOTE: Cognito "Threat Protection" (advanced security /
      // compromised-credential + adaptive risk) requires the paid Plus tier;
      // left off to avoid per-MAU cost on a demo. Enable by upgrading the pool
      // feature plan to Plus + advancedSecurityMode.
      mfa: Mfa.OPTIONAL,
      mfaSecondFactor: { sms: false, otp: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
        tempPasswordValidity: Duration.days(7),
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      userVerification: {
        emailSubject: "Verify your ConnectNest account",
        emailBody: "Your ConnectNest verification code is {####}",
        emailStyle: VerificationEmailStyle.CODE,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Attach the Custom Message trigger AFTER the pool is constructed. This
    // branded HTML overrides the default verification/reset emails for the
    // SignUp / ResendCode / ForgotPassword flows.
    this.userPool.addTrigger(
      UserPoolOperation.CUSTOM_MESSAGE,
      customMessageFn
    );

    // ---- Hosted UI domain (required for the OAuth redirect flow) ----
    // Prefix must be globally unique within the region.
    const domainPrefix =
      (this.node.tryGetContext("hostedUiPrefix") as string) ||
      "connectnest-auth";
    this.userPool.addDomain("HostedUiDomain", {
      cognitoDomain: { domainPrefix },
    });

    // ---- Optional social identity providers (read secrets from context) ----
    const ctx = (k: string) => this.node.tryGetContext(k) as string | undefined;
    const supportedIdps: UserPoolClientIdentityProvider[] = [
      UserPoolClientIdentityProvider.COGNITO,
    ];

    // Google — secret stored in AWS Secrets Manager and referenced dynamically
    // (via {{resolve:secretsmanager:...}}) so the plaintext isn't baked into
    // the Cognito resource / template. Seeded once from context; rotate in
    // Secrets Manager thereafter.
    const googleClientId = ctx("googleClientId");
    const googleClientSecret = ctx("googleClientSecret");
    let googleIdp: UserPoolIdentityProviderGoogle | undefined;
    if (googleClientId && googleClientSecret) {
      const googleSecret = new Secret(this, "GoogleOAuthSecret", {
        secretName: "connectnest/google-oauth-client-secret",
        description: "Google OAuth client secret for Cognito federation",
        secretStringValue: SecretValue.unsafePlainText(googleClientSecret),
      });
      googleIdp = new UserPoolIdentityProviderGoogle(this, "GoogleIdp", {
        userPool: this.userPool,
        clientId: googleClientId,
        clientSecretValue: googleSecret.secretValue, // dynamic reference
        scopes: ["openid", "email", "profile"],
        attributeMapping: {
          email: ProviderAttribute.GOOGLE_EMAIL,
          fullname: ProviderAttribute.GOOGLE_NAME,
        },
      });
      supportedIdps.push(UserPoolClientIdentityProvider.GOOGLE);
    }

    // Microsoft (Azure AD / Entra) via generic OIDC
    const msClientId = ctx("msClientId");
    const msClientSecret = ctx("msClientSecret");
    // e.g. https://login.microsoftonline.com/<tenant>/v2.0  (or "common")
    const msIssuer =
      ctx("msIssuer") || "https://login.microsoftonline.com/common/v2.0";
    let msIdp: UserPoolIdentityProviderOidc | undefined;
    if (msClientId && msClientSecret) {
      msIdp = new UserPoolIdentityProviderOidc(this, "MicrosoftIdp", {
        name: "Microsoft", // the provider name used in Hosted UI / identity_provider param
        userPool: this.userPool,
        clientId: msClientId,
        clientSecret: msClientSecret,
        issuerUrl: msIssuer,
        scopes: ["openid", "email", "profile"],
        attributeMapping: {
          email: ProviderAttribute.other("email"),
          fullname: ProviderAttribute.other("name"),
        },
      });
      supportedIdps.push(
        UserPoolClientIdentityProvider.custom("Microsoft")
      );
    }

    // ---- Callback / logout URLs for the OAuth redirect flow ----
    const callbackUrls = [
      "http://localhost:3000/auth/callback",
      ...((ctx("appCallbackUrls") as string | undefined)?.split(",") ?? []),
    ];
    const logoutUrls = [
      "http://localhost:3000/login",
      ...((ctx("appLogoutUrls") as string | undefined)?.split(",") ?? []),
    ];

    this.userPoolClient = this.userPool.addClient("WebClient", {
      userPoolClientName: "connectnest-web",
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
        callbackUrls,
        logoutUrls,
      },
      supportedIdentityProviders: supportedIdps,
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      // Short refresh window limits blast radius if a token is ever leaked
      // (tokens live in localStorage; see HANDOFF security section).
      refreshTokenValidity: Duration.days(1),
      preventUserExistenceErrors: true,
    });

    // Make sure the client is created after the providers it references.
    if (googleIdp) this.userPoolClient.node.addDependency(googleIdp);
    if (msIdp) this.userPoolClient.node.addDependency(msIdp);

    new CfnOutput(this, "UserPoolId", { value: this.userPool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
    new CfnOutput(this, "HostedUiDomain", {
      value: `${domainPrefix}.auth.${this.region}.amazoncognito.com`,
    });
  }
}
