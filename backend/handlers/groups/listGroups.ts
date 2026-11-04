import { scanAll } from "../../shared/scan.js";
import { ok, serverError, type ApiEvent } from "../../shared/http.js";

const TABLE = process.env.GROUPS_TABLE!;

/** GET /groups — list all groups. */
export const handler = async (_event: ApiEvent) => {
  try {
    const items = (await scanAll({ TableName: TABLE })).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
    return ok({ items });
  } catch (err) {
    console.error("listGroups error", err);
    return serverError();
  }
};
