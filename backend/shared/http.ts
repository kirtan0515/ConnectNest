import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";

/** HTTP API v2.0 event with a Cognito JWT authorizer attached. */
export type ApiEvent = APIGatewayProxyEventV2WithJWTAuthorizer;
export type ApiResult = APIGatewayProxyResultV2;

const baseHeaders = {
  "Content-Type": "application/json",
  // API Gateway also applies CORS; this is a belt-and-braces default.
  "Access-Control-Allow-Origin": "*",
};

/** Build a JSON response in HTTP API payload format 2.0. */
export function json(statusCode: number, body: unknown): ApiResult {
  return {
    statusCode,
    headers: baseHeaders,
    body: JSON.stringify(body),
  };
}

export const ok = (body: unknown) => json(200, body);
export const created = (body: unknown) => json(201, body);
export const noContent = (): ApiResult => ({
  statusCode: 204,
  headers: baseHeaders,
  body: "",
});
export const badRequest = (message: string) => json(400, { message });
export const forbidden = (message = "Forbidden") => json(403, { message });
export const notFound = (message = "Not found") => json(404, { message });
export const serverError = (message = "Internal server error") =>
  json(500, { message });

/**
 * The verified Cognito subject (user id) from JWT claims.
 * SECURITY: always derive identity from the token, never the request body.
 */
export function getUserId(event: ApiEvent): string {
  const sub = event.requestContext.authorizer?.jwt?.claims?.sub;
  if (!sub || typeof sub !== "string") {
    throw new UnauthorizedError("Missing subject claim");
  }
  return sub;
}

/** The verified email claim, if present. */
export function getEmail(event: ApiEvent): string | undefined {
  const email = event.requestContext.authorizer?.jwt?.claims?.email;
  return typeof email === "string" ? email : undefined;
}

/** A display name from claims (name/fullName), falling back to email. */
export function getName(event: ApiEvent): string | undefined {
  const claims = event.requestContext.authorizer?.jwt?.claims ?? {};
  const name = claims.name ?? claims["custom:fullName"] ?? claims.email;
  return typeof name === "string" ? name : undefined;
}

/** Parse a JSON body safely; returns {} for empty/invalid bodies. */
export function parseBody<T = Record<string, unknown>>(event: ApiEvent): T {
  if (!event.body) return {} as T;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(raw) as T;
  } catch {
    throw new BadRequestError("Invalid JSON body");
  }
}

/** Path parameter accessor. */
export function pathParam(event: ApiEvent, key: string): string | undefined {
  return event.pathParameters?.[key];
}

export class UnauthorizedError extends Error {}
export class BadRequestError extends Error {}
