import type {
  APIGatewayProxyWebsocketEventV2WithRequestContext,
  APIGatewayEventWebsocketRequestContextV2,
} from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";

const TABLE = process.env.CONNECTIONS_TABLE!;

// The stock APIGatewayProxyWebsocketEventV2 omits requestContext.authorizer,
// so widen it to carry the authorizer context set by connectAuthorizer.
type ConnectEvent = APIGatewayProxyWebsocketEventV2WithRequestContext<
  APIGatewayEventWebsocketRequestContextV2 & {
    authorizer?: { userId?: string };
  }
>;

/** $connect — store the connection keyed by connectionId with a TTL backstop. */
export const handler = async (event: ConnectEvent) => {
  const userId = event.requestContext.authorizer?.userId;
  const connectionId = event.requestContext.connectionId;

  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          connectionId,
          userId,
          ttl: Math.floor(Date.now() / 1000) + 7200,
        },
      })
    );
    return { statusCode: 200 };
  } catch (err) {
    console.error("connect error", err);
    return { statusCode: 500 };
  }
};
