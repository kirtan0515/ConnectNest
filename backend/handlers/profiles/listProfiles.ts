import { ddb } from "../../shared/db.js";
import { scanAll } from "../../shared/scan.js";
import { ok, serverError, getUserId, type ApiEvent } from "../../shared/http.js";

const TABLE = process.env.PROFILES_TABLE!;

/**
 * GET /profiles?q=term — a small user directory for starting a direct message.
 * Returns active profiles (excluding the caller) as { userId, name, major },
 * optionally filtered by a case-insensitive name/major substring. Scan is fine
 * at campus scale; swap to a search index if the user base grows large.
 * PII: never returns email.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const me = getUserId(event);
    const q = (event.queryStringParameters?.q ?? "").trim().toLowerCase();

    const rows = await scanAll({ TableName: TABLE });
    const items = rows
      .filter((p) => {
        if (p.userId === me) return false;
        if (p.status === "deactivated" || p.status === "pending_deletion") return false;
        if (!q) return true;
        const name = String(p.name ?? "").toLowerCase();
        const major = String(p.major ?? "").toLowerCase();
        return name.includes(q) || major.includes(q);
      })
      .map((p) => ({
        userId: p.userId,
        name: p.name ?? "",
        major: p.major ?? "",
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      .slice(0, 25);

    return ok({ items });
  } catch (err) {
    console.error("listProfiles error", err);
    return serverError();
  }
};
