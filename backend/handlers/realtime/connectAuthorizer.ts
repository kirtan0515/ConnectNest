import type {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { CognitoJwtVerifier } from "aws-jwt-verify";

// Pool/client ids come ONLY from env — never hardcode the literals.
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID!,
  clientId: process.env.USER_POOL_CLIENT_ID!,
  tokenUse: "id",
});

/**
 * REQUEST Lambda authorizer for the WebSocket $connect route. Verifies the
 * Cognito id token passed as ?token=... and allows the connection, exposing
 * the verified subject as context.userId. Any failure throws so the gateway
 * returns a Deny (401).
 */
export const handler = async (
  event: APIGatewayRequestAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  const token = event.queryStringParameters?.token;
  if (!token) {
    throw new Error("Unauthorized: missing token");
  }

  const payload = await verifier.verify(token);

  return {
    principalId: payload.sub,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: event.methodArn,
        },
      ],
    },
    context: { userId: payload.sub },
  };
};
