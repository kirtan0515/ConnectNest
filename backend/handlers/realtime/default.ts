import type { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";

/** $default — the server does not expect inbound frames; log and ack. */
export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  console.log("unexpected inbound frame", event.body);
  return { statusCode: 200 };
};
