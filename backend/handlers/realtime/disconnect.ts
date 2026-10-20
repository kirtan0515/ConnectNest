import type { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";

const TABLE = process.env.CONNECTIONS_TABLE!;

/** $disconnect — remove the connection. TTL is the backstop if this fails. */
export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  try {
    await ddb.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { connectionId: event.requestContext.connectionId },
      })
    );
  } catch (err) {
    console.error("disconnect error", err);
  }
  return { statusCode: 200 };
};
