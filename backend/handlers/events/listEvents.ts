import { scanAll } from "../../shared/scan.js";
import { ok, serverError, type ApiEvent } from "../../shared/http.js";

const TABLE = process.env.EVENTS_TABLE!;

/**
 * GET /events — list all events, newest first.
 * Paginated scan (no 1 MB page limit); swap to a query on a status/date GSI
 * if this table grows large enough for scan cost to matter.
 */
export const handler = async (_event: ApiEvent) => {
  try {
    const items = (await scanAll({ TableName: TABLE })).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
    return ok({ items });
  } catch (err) {
    console.error("listEvents error", err);
    return serverError();
  }
};
