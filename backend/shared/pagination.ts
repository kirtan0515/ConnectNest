/**
 * Opaque pagination tokens for DynamoDB Query results.
 *
 * The token is the base64url of the LastEvaluatedKey. Because it round-trips
 * through the client it is untrusted input: decodeToken only accepts a plain
 * object whose keys are on an allow-list and whose values are strings, so a
 * caller can't smuggle arbitrary attributes into ExclusiveStartKey.
 */
export function encodeToken(key: Record<string, unknown> | undefined): string | undefined {
  if (!key) return undefined;
  return Buffer.from(JSON.stringify(key), "utf8").toString("base64url");
}

export function decodeToken(
  token: string | undefined,
  allowedKeys: string[]
): Record<string, string> | undefined {
  if (!token) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
  } catch {
    throw new InvalidTokenError();
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new InvalidTokenError();
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (!allowedKeys.includes(k) || typeof v !== "string") {
      throw new InvalidTokenError();
    }
    out[k] = v;
  }
  // Every allowed key must be present for the key to be usable.
  if (allowedKeys.some((k) => !(k in out))) throw new InvalidTokenError();
  return out;
}

/** Clamp a client-supplied page size into a sane range. */
export function clampLimit(raw: string | undefined, def = 50, max = 100): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return def;
  return Math.min(n, max);
}

export class InvalidTokenError extends Error {
  constructor() {
    super("Invalid pagination token");
  }
}
