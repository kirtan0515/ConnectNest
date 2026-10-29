import * as path from "path";
import {
  Stack,
  StackProps,
  Duration,
  CfnOutput,
  RemovalPolicy,
  Fn,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { Runtime, Architecture } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import {
  Bucket,
  HttpMethods,
  BlockPublicAccess,
  BucketEncryption,
} from "aws-cdk-lib/aws-s3";
import {
  HttpApi,
  HttpMethod,
  CorsHttpMethod,
  WebSocketApi,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpUserPoolAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { EventType } from "aws-cdk-lib/aws-s3";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";

/** Repo root — handlers live in ../backend, outside infra/. */
const REPO_ROOT = path.join(__dirname, "..", "..");
const BACKEND_DIR = path.join(REPO_ROOT, "backend");
const DEPS_LOCK = path.join(BACKEND_DIR, "package-lock.json");

export interface ApiStackProps extends StackProps {
  userPool: UserPool;
  userPoolClient: UserPoolClient;
  tables: {
    profiles: Table;
    events: Table;
    rsvps: Table;
    posts: Table;
    comments: Table;
    postLikes: Table;
    groups: Table;
    groupMembers: Table;
    auditLog: Table;
  };
  /**
   * Optional realtime wiring. When present, createPost/createEvent gain the
   * env + IAM needed to push new items to connected WebSocket clients.
   */
  realtime?: {
    connectionsTable: Table;
    // grantManageConnections is defined on the concrete WebSocketApi class
    // (not the IWebSocketApi interface) in aws-cdk-lib 2.271.0.
    webSocketApi: WebSocketApi;
    managementEndpoint: string;
  };
}

export class ApiStack extends Stack {
  public readonly httpApi: HttpApi;
  /** The API's regional domain (host only), e.g. abc.execute-api.us-east-1.amazonaws.com */
  public readonly apiDomain: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { userPool, userPoolClient, tables } = props;

    // ---- Uploads bucket (replaces Amplify Storage) ----
    const uploadsBucket = new Bucket(this, "UploadsBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      // Security: never allow public access — objects are reached only via
      // short-lived presigned URLs. Encrypt at rest and enforce TLS in transit.
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      cors: [
        {
          allowedMethods: [
            HttpMethods.GET,
            HttpMethods.PUT,
            HttpMethods.POST,
            HttpMethods.HEAD,
          ],
          // Allowed upload origins. Override via -c appUploadOrigins=... in prod.
          allowedOrigins:
            (this.node.tryGetContext("appUploadOrigins") as string | undefined)
              ?.split(",") ?? ["http://localhost:3000"],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
          maxAge: 3000,
        },
      ],
    });

    // ---- HTTP API + Cognito JWT authorizer ----
    // CORS tightened to known app origins (localhost dev + CloudFront). In
    // production the SPA calls the API same-origin via CloudFront /api/*, so
    // CORS mainly matters for local dev. Override with -c appCorsOrigins=...
    const corsOrigins = (
      (this.node.tryGetContext("appCorsOrigins") as string | undefined) ??
      "http://localhost:3000"
    ).split(",");
    this.httpApi = new HttpApi(this, "HttpApi", {
      apiName: "connectnest-api",
      corsPreflight: {
        allowOrigins: corsOrigins,
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.DELETE,
          CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ["authorization", "content-type"],
        maxAge: Duration.days(1),
      },
    });

    const authorizer = new HttpUserPoolAuthorizer("JwtAuthorizer", userPool, {
      userPoolClients: [userPoolClient],
    });

    // ---- Lambda factory (bundles from ../backend via esbuild) ----
    // The Node 22 runtime only reliably ships the COMMON @aws-sdk/* clients
    // (dynamodb, lib-dynamodb, s3). Less-common packages (rekognition,
    // s3-presigned-post, s3-request-presigner) are NOT guaranteed present, so
    // we externalize only the core ones and let esbuild bundle the rest.
    const CORE_SDK_EXTERNALS = [
      "@aws-sdk/client-dynamodb",
      "@aws-sdk/lib-dynamodb",
      "@aws-sdk/client-s3",
    ];
    const makeFn = (
      logicalId: string,
      entry: string,
      env: Record<string, string> = {},
      opts: { timeoutSeconds?: number; memory?: number } = {}
    ): NodejsFunction =>
      new NodejsFunction(this, logicalId, {
        entry: path.join(BACKEND_DIR, entry),
        handler: "handler",
        runtime: Runtime.NODEJS_22_X,
        architecture: Architecture.ARM_64,
        memorySize: opts.memory ?? 256,
        timeout: Duration.seconds(opts.timeoutSeconds ?? 10),
        projectRoot: REPO_ROOT,
        depsLockFilePath: DEPS_LOCK,
        bundling: {
          format: OutputFormat.ESM,
          minify: true,
          target: "node22",
          externalModules: CORE_SDK_EXTERNALS,
          // Some AWS SDK clients (e.g. apigatewaymanagementapi, used by the
          // real-time broadcast helper) do a dynamic `require("node:https")`.
          // In an esbuild ESM bundle that throws "Dynamic require of X is not
          // supported" and crashes the Lambda on load. This banner recreates a
          // CommonJS `require` from `node:module` so those dynamic requires work.
          banner:
            "import{createRequire as __cr}from'node:module';import{fileURLToPath as __ftu}from'node:url';import{dirname as __dn}from'node:path';const require=__cr(import.meta.url);const __filename=__ftu(import.meta.url);const __dirname=__dn(__filename);",
        },
        environment: env,
      });

    // ---- Handlers ----
    // Profiles
    const getProfile = makeFn("GetProfileFn", "handlers/profiles/getProfile.ts", {
      PROFILES_TABLE: tables.profiles.tableName,
    });
    const upsertProfile = makeFn(
      "UpsertProfileFn",
      "handlers/profiles/upsertProfile.ts",
      { PROFILES_TABLE: tables.profiles.tableName }
    );

    // Account lifecycle
    const deactivateAccount = makeFn(
      "DeactivateAccountFn",
      "handlers/profiles/deactivateAccount.ts",
      {
        PROFILES_TABLE: tables.profiles.tableName,
        AUDIT_LOG_TABLE: tables.auditLog.tableName,
      }
    );
    const reactivateAccount = makeFn(
      "ReactivateAccountFn",
      "handlers/profiles/reactivateAccount.ts",
      {
        PROFILES_TABLE: tables.profiles.tableName,
        AUDIT_LOG_TABLE: tables.auditLog.tableName,
      }
    );
    const deleteAccount = makeFn(
      "DeleteAccountFn",
      "handlers/profiles/deleteAccount.ts",
      {
        PROFILES_TABLE: tables.profiles.tableName,
        AUDIT_LOG_TABLE: tables.auditLog.tableName,
      }
    );
    // Scheduled purge — hard-deletes across all tables + Cognito.
    const purgeAccounts = makeFn(
      "PurgeAccountsFn",
      "handlers/profiles/purgeAccounts.ts",
      {
        PROFILES_TABLE: tables.profiles.tableName,
        EVENTS_TABLE: tables.events.tableName,
        RSVPS_TABLE: tables.rsvps.tableName,
        POSTS_TABLE: tables.posts.tableName,
        COMMENTS_TABLE: tables.comments.tableName,
        POST_LIKES_TABLE: tables.postLikes.tableName,
        GROUPS_TABLE: tables.groups.tableName,
        GROUP_MEMBERS_TABLE: tables.groupMembers.tableName,
        AUDIT_LOG_TABLE: tables.auditLog.tableName,
        USER_POOL_ID: userPool.userPoolId,
      },
      { timeoutSeconds: 120, memory: 512 }
    );

    // Events
    const listEvents = makeFn("ListEventsFn", "handlers/events/listEvents.ts", {
      EVENTS_TABLE: tables.events.tableName,
    });
    const getEvent = makeFn("GetEventFn", "handlers/events/getEvent.ts", {
      EVENTS_TABLE: tables.events.tableName,
    });
    const createEvent = makeFn("CreateEventFn", "handlers/events/createEvent.ts", {
      EVENTS_TABLE: tables.events.tableName,
    });
    const updateEvent = makeFn("UpdateEventFn", "handlers/events/updateEvent.ts", {
      EVENTS_TABLE: tables.events.tableName,
    });
    const deleteEvent = makeFn("DeleteEventFn", "handlers/events/deleteEvent.ts", {
      EVENTS_TABLE: tables.events.tableName,
    });
    const rsvpToEvent = makeFn("RsvpToEventFn", "handlers/events/rsvpToEvent.ts", {
      EVENTS_TABLE: tables.events.tableName,
      RSVPS_TABLE: tables.rsvps.tableName,
    });
    const listAttendees = makeFn(
      "ListAttendeesFn",
      "handlers/events/listAttendees.ts",
      { RSVPS_TABLE: tables.rsvps.tableName }
    );
    const listMyRsvps = makeFn("ListMyRsvpsFn", "handlers/events/listMyRsvps.ts", {
      EVENTS_TABLE: tables.events.tableName,
      RSVPS_TABLE: tables.rsvps.tableName,
    });

    // Posts / likes / comments
    const listPosts = makeFn("ListPostsFn", "handlers/posts/listPosts.ts", {
      POSTS_TABLE: tables.posts.tableName,
    });
    const createPost = makeFn("CreatePostFn", "handlers/posts/createPost.ts", {
      POSTS_TABLE: tables.posts.tableName,
      GROUP_MEMBERS_TABLE: tables.groupMembers.tableName,
    });
    const deletePost = makeFn("DeletePostFn", "handlers/posts/deletePost.ts", {
      POSTS_TABLE: tables.posts.tableName,
    });
    const toggleLike = makeFn("ToggleLikeFn", "handlers/posts/toggleLike.ts", {
      POSTS_TABLE: tables.posts.tableName,
      POST_LIKES_TABLE: tables.postLikes.tableName,
    });
    const listComments = makeFn(
      "ListCommentsFn",
      "handlers/posts/listComments.ts",
      { COMMENTS_TABLE: tables.comments.tableName }
    );
    const createComment = makeFn(
      "CreateCommentFn",
      "handlers/posts/createComment.ts",
      { COMMENTS_TABLE: tables.comments.tableName }
    );

    // Groups
    const listGroups = makeFn("ListGroupsFn", "handlers/groups/listGroups.ts", {
      GROUPS_TABLE: tables.groups.tableName,
    });
    const createGroup = makeFn("CreateGroupFn", "handlers/groups/createGroup.ts", {
      GROUPS_TABLE: tables.groups.tableName,
    });
    const getGroup = makeFn("GetGroupFn", "handlers/groups/getGroup.ts", {
      GROUPS_TABLE: tables.groups.tableName,
    });
    const joinGroup = makeFn("JoinGroupFn", "handlers/groups/joinGroup.ts", {
      GROUPS_TABLE: tables.groups.tableName,
      GROUP_MEMBERS_TABLE: tables.groupMembers.tableName,
    });
    const listMyGroups = makeFn(
      "ListMyGroupsFn",
      "handlers/groups/listMyGroups.ts",
      {
        GROUPS_TABLE: tables.groups.tableName,
        GROUP_MEMBERS_TABLE: tables.groupMembers.tableName,
      }
    );
    const listMembers = makeFn("ListMembersFn", "handlers/groups/listMembers.ts", {
      GROUP_MEMBERS_TABLE: tables.groupMembers.tableName,
    });

    // Activity — read-only cross-entity aggregator for the central dashboard.
    const getActivity = makeFn("GetActivityFn", "handlers/activity/getActivity.ts", {
      EVENTS_TABLE: tables.events.tableName,
      POSTS_TABLE: tables.posts.tableName,
      GROUPS_TABLE: tables.groups.tableName,
    });

    // Uploads (presigned URL)
    const getUploadUrl = makeFn(
      "GetUploadUrlFn",
      "handlers/files/getUploadUrl.ts",
      { UPLOADS_BUCKET: uploadsBucket.bucketName }
    );
    const getDownloadUrl = makeFn(
      "GetDownloadUrlFn",
      "handlers/files/getDownloadUrl.ts",
      { UPLOADS_BUCKET: uploadsBucket.bucketName }
    );

    // ---- IAM: least privilege per handler ----
    tables.profiles.grantReadData(getProfile);
    tables.profiles.grantReadWriteData(upsertProfile);

    // Account lifecycle grants
    tables.profiles.grantReadWriteData(deactivateAccount);
    tables.auditLog.grantWriteData(deactivateAccount);
    tables.profiles.grantReadWriteData(reactivateAccount);
    tables.auditLog.grantWriteData(reactivateAccount);
    tables.profiles.grantReadWriteData(deleteAccount);
    tables.auditLog.grantWriteData(deleteAccount);
    // Purge needs read+delete across all tables + Cognito AdminDeleteUser.
    tables.profiles.grantReadWriteData(purgeAccounts);
    tables.events.grantReadWriteData(purgeAccounts);
    tables.rsvps.grantReadWriteData(purgeAccounts);
    tables.posts.grantReadWriteData(purgeAccounts);
    tables.comments.grantReadWriteData(purgeAccounts);
    tables.postLikes.grantReadWriteData(purgeAccounts);
    tables.groups.grantReadWriteData(purgeAccounts);
    tables.groupMembers.grantReadWriteData(purgeAccounts);
    tables.auditLog.grantWriteData(purgeAccounts);
    purgeAccounts.addToRolePolicy(
      new PolicyStatement({
        actions: ["cognito-idp:AdminDeleteUser"],
        resources: [userPool.userPoolArn],
      })
    );

    tables.events.grantReadData(listEvents);
    tables.events.grantReadData(getEvent);
    tables.events.grantReadWriteData(createEvent);
    tables.events.grantReadWriteData(updateEvent);
    tables.events.grantReadWriteData(deleteEvent);
    tables.events.grantReadData(rsvpToEvent);
    tables.rsvps.grantReadWriteData(rsvpToEvent);
    tables.rsvps.grantReadData(listAttendees);
    tables.events.grantReadData(listMyRsvps);
    tables.rsvps.grantReadData(listMyRsvps);

    tables.posts.grantReadData(listPosts);
    tables.posts.grantReadWriteData(createPost);
    tables.groupMembers.grantReadData(createPost);
    tables.posts.grantReadWriteData(deletePost);
    tables.posts.grantReadWriteData(toggleLike);
    tables.postLikes.grantReadWriteData(toggleLike);
    tables.comments.grantReadData(listComments);
    tables.comments.grantReadWriteData(createComment);

    tables.groups.grantReadData(listGroups);
    tables.groups.grantReadWriteData(createGroup);
    tables.groups.grantReadData(getGroup);
    tables.groups.grantReadData(joinGroup);
    tables.groupMembers.grantReadWriteData(joinGroup);
    tables.groups.grantReadData(listMyGroups);
    tables.groupMembers.grantReadData(listMyGroups);
    tables.groupMembers.grantReadData(listMembers);

    // Activity aggregator — least-privilege read on the three source tables.
    tables.events.grantReadData(getActivity);
    tables.posts.grantReadData(getActivity);
    tables.groups.grantReadData(getActivity);

    uploadsBucket.grantPut(getUploadUrl);
    uploadsBucket.grantRead(getUploadUrl);
    // Download handler only needs to read objects for presigned GETs.
    uploadsBucket.grantRead(getDownloadUrl);

    // ---- Realtime push (optional, additive) ----
    // When the realtime stack is wired in, createPost/createEvent broadcast the
    // new item to connected WebSocket clients. addEnvironment preserves each
    // handler's existing env; nothing outside this block changes.
    if (props.realtime) {
      const { connectionsTable, webSocketApi, managementEndpoint } =
        props.realtime;

      createPost.addEnvironment("CONNECTIONS_TABLE", connectionsTable.tableName);
      createPost.addEnvironment("WS_MANAGEMENT_ENDPOINT", managementEndpoint);
      createEvent.addEnvironment(
        "CONNECTIONS_TABLE",
        connectionsTable.tableName
      );
      createEvent.addEnvironment("WS_MANAGEMENT_ENDPOINT", managementEndpoint);

      connectionsTable.grantReadWriteData(createPost);
      connectionsTable.grantReadWriteData(createEvent);
      webSocketApi.grantManageConnections(createPost);
      webSocketApi.grantManageConnections(createEvent);
    }

    // ---- Image moderation: S3 ObjectCreated -> Rekognition -> delete if unsafe ----
    const moderateImage = makeFn(
      "ModerateImageFn",
      "handlers/files/moderateImage.ts",
      { UPLOADS_BUCKET: uploadsBucket.bucketName },
      { timeoutSeconds: 30, memory: 512 }
    );
    // Needs to read the uploaded object (for Rekognition) and delete it if it
    // violates policy. Rekognition itself also reads directly from S3.
    uploadsBucket.grantRead(moderateImage);
    uploadsBucket.grantDelete(moderateImage);
    moderateImage.addToRolePolicy(
      new PolicyStatement({
        actions: ["rekognition:DetectModerationLabels"],
        resources: ["*"], // Rekognition DetectModerationLabels is not resource-scoped
      })
    );
    // Fire on every new object in the bucket.
    moderateImage.addEventSource(
      new S3EventSource(uploadsBucket, { events: [EventType.OBJECT_CREATED] })
    );

    // ---- Routes ----
    const route = (
      method: HttpMethod,
      routePath: string,
      fn: NodejsFunction
    ) => {
      this.httpApi.addRoutes({
        path: routePath,
        methods: [method],
        integration: new HttpLambdaIntegration(
          `${fn.node.id}Integration`,
          fn
        ),
        authorizer,
      });
    };

    // Profiles
    route(HttpMethod.GET, "/profiles/me", getProfile);
    route(HttpMethod.GET, "/profiles/{userId}", getProfile);
    route(HttpMethod.PUT, "/profiles/me", upsertProfile);

    // Account lifecycle
    route(HttpMethod.POST, "/account/deactivate", deactivateAccount);
    route(HttpMethod.POST, "/account/reactivate", reactivateAccount);
    route(HttpMethod.POST, "/account/delete", deleteAccount);

    // Events
    route(HttpMethod.GET, "/events", listEvents);
    route(HttpMethod.POST, "/events", createEvent);
    route(HttpMethod.GET, "/events/{eventId}", getEvent);
    route(HttpMethod.PUT, "/events/{eventId}", updateEvent);
    route(HttpMethod.DELETE, "/events/{eventId}", deleteEvent);
    route(HttpMethod.POST, "/events/{eventId}/rsvp", rsvpToEvent);
    route(HttpMethod.GET, "/events/{eventId}/rsvps", listAttendees);
    route(HttpMethod.GET, "/me/rsvps", listMyRsvps);

    // Posts / likes / comments
    route(HttpMethod.GET, "/posts", listPosts);
    route(HttpMethod.POST, "/posts", createPost);
    route(HttpMethod.DELETE, "/posts/{postId}", deletePost);
    route(HttpMethod.POST, "/posts/{postId}/like", toggleLike);
    route(HttpMethod.GET, "/posts/{postId}/comments", listComments);
    route(HttpMethod.POST, "/posts/{postId}/comments", createComment);

    // Groups
    route(HttpMethod.GET, "/groups", listGroups);
    route(HttpMethod.POST, "/groups", createGroup);
    route(HttpMethod.GET, "/groups/{groupId}", getGroup);
    route(HttpMethod.POST, "/groups/{groupId}/join", joinGroup);
    route(HttpMethod.GET, "/groups/{groupId}/members", listMembers);
    route(HttpMethod.GET, "/me/groups", listMyGroups);

    // Activity (central dashboard aggregator)
    route(HttpMethod.GET, "/activity", getActivity);

    // Uploads
    route(HttpMethod.POST, "/uploads/presign", getUploadUrl);
    route(HttpMethod.GET, "/uploads/url", getDownloadUrl);

    // ---- AWS WAF ----
    // WAF protects the app at the CloudFront edge (see HostingStack:
    // connectnest-cdn-waf, CLOUDFRONT scope, actively associated). A separate
    // REGIONAL WebACL on the HTTP API is intentionally NOT created: WAFv2
    // rejects the HTTP API (v2) "$default" stage ARN, and the CloudFront WAF
    // already covers all public traffic (SPA + /api/*). This keeps one WAF,
    // avoiding an orphaned/duplicate ACL.

    // ---- Scheduled account purge (daily) ----
    // Runs the purge Lambda every day to hard-delete accounts whose 30-day
    // deletion grace window has elapsed.
    new Rule(this, "PurgeAccountsSchedule", {
      ruleName: "connectnest-purge-accounts-daily",
      schedule: Schedule.rate(Duration.days(1)),
      targets: [new LambdaFunction(purgeAccounts)],
    });

    // apiEndpoint is https://<id>.execute-api.<region>.amazonaws.com — expose the
    // bare host so CloudFront can use it as an HTTP origin.
    this.apiDomain = Fn.select(2, Fn.split("/", this.httpApi.apiEndpoint));

    new CfnOutput(this, "ApiUrl", { value: this.httpApi.apiEndpoint });
    new CfnOutput(this, "UploadsBucketName", {
      value: uploadsBucket.bucketName,
    });
  }
}
