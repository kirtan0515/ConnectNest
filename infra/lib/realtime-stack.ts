import * as path from "path";
import {
  Stack,
  StackProps,
  Duration,
  CfnOutput,
  RemovalPolicy,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { Runtime, Architecture } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  AttributeType,
  BillingMode,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { WebSocketLambdaAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";

/** Repo root — handlers live in ../backend, outside infra/. */
const REPO_ROOT = path.join(__dirname, "..", "..");
const BACKEND_DIR = path.join(REPO_ROOT, "backend");
const DEPS_LOCK = path.join(BACKEND_DIR, "package-lock.json");
// Match api-stack: externalize only the core SDK clients the Node 22 runtime
// reliably ships; esbuild bundles everything else (including aws-jwt-verify and
// @aws-sdk/client-apigatewaymanagementapi used by the realtime handlers).
const CORE_SDK_EXTERNALS = [
  "@aws-sdk/client-dynamodb",
  "@aws-sdk/lib-dynamodb",
  "@aws-sdk/client-s3",
];

export interface RealtimeStackProps extends StackProps {
  userPool: UserPool;
  userPoolClientId: string;
}

/**
 * RealtimeStack — WebSocket push for live post/event feeds.
 *
 * A Connections DynamoDB table tracks open sockets; a WebSocketApi with a
 * $connect REQUEST Lambda authorizer (verifying the Cognito id token from the
 * ?token=... querystring) plus connect/disconnect/default route Lambdas manages
 * the socket lifecycle. ApiStack grants createPost/createEvent the ability to
 * read connections and post to clients via the management endpoint.
 */
export class RealtimeStack extends Stack {
  public readonly connectionsTable: Table;
  public readonly webSocketApi: WebSocketApi;
  public readonly webSocketStage: WebSocketStage;
  public readonly managementEndpoint: string;

  constructor(scope: Construct, id: string, props: RealtimeStackProps) {
    super(scope, id, props);

    // ---- Lambda factory (identical conventions to api-stack.ts) ----
    const makeFn = (
      logicalId: string,
      entry: string,
      env: Record<string, string> = {}
    ): NodejsFunction =>
      new NodejsFunction(this, logicalId, {
        entry: path.join(BACKEND_DIR, entry),
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
        environment: env,
      });

    // ---- Connections table (connectionId PK, TTL-swept) ----
    this.connectionsTable = new Table(this, "ConnectionsTable", {
      partitionKey: { name: "connectionId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: "ttl",
    });

    // ---- Lambdas ----
    const authorizerFn = makeFn(
      "WsAuthorizerFn",
      "handlers/realtime/connectAuthorizer.ts",
      {
        USER_POOL_ID: props.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.userPoolClientId,
      }
    );
    const connectFn = makeFn("WsConnectFn", "handlers/realtime/connect.ts", {
      CONNECTIONS_TABLE: this.connectionsTable.tableName,
    });
    const disconnectFn = makeFn(
      "WsDisconnectFn",
      "handlers/realtime/disconnect.ts",
      { CONNECTIONS_TABLE: this.connectionsTable.tableName }
    );
    const defaultFn = makeFn("WsDefaultFn", "handlers/realtime/default.ts");

    this.connectionsTable.grantReadWriteData(connectFn);
    this.connectionsTable.grantReadWriteData(disconnectFn);

    // ---- WebSocket API (stable aws-apigatewayv2* constructs) ----
    this.webSocketApi = new WebSocketApi(this, "WebSocketApi", {
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration("ConnectInteg", connectFn),
        authorizer: new WebSocketLambdaAuthorizer(
          "WsConnectAuthorizer",
          authorizerFn,
          { identitySource: ["route.request.querystring.token"] }
        ),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "DisconnectInteg",
          disconnectFn
        ),
      },
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration("DefaultInteg", defaultFn),
      },
    });

    // prod stage, auto-deployed. No access logging by design.
    this.webSocketStage = new WebSocketStage(this, "Stage", {
      webSocketApi: this.webSocketApi,
      stageName: "prod",
      autoDeploy: true,
    });

    // Management (callback) endpoint used by createPost/createEvent to push.
    this.managementEndpoint = this.webSocketStage.callbackUrl;

    new CfnOutput(this, "WebSocketUrl", { value: this.webSocketStage.url });
    new CfnOutput(this, "ManagementEndpoint", {
      value: this.webSocketStage.callbackUrl,
    });
  }
}
