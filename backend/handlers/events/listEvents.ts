import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { ok, serverError, type ApiEvent } from "../../shared/http.js";

const TABLE = process.env.EVENTS_TABLE!;

/**
 * GET /events — list all events, newest first.
 * Scan is fine at demo scale; swap to a query on a status/date GSI if this grows.
 */
export const handler = async (_event: ApiEvent) => {
  try {
    const res = await ddb.send(new ScanCommand({ TableName: TABLE }));
    const items = (res.Items ?? []).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
    return ok({ items });
  } catch (err) {
    console.error("listEvents error", err);
    return serverError();
  }
};
