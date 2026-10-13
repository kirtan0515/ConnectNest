import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { ok, serverError, type ApiEvent } from "../../shared/http.js";

const TABLE = process.env.GROUPS_TABLE!;

/** GET /groups — list all groups. */
export const handler = async (_event: ApiEvent) => {
  try {
    const res = await ddb.send(new ScanCommand({ TableName: TABLE }));
    const items = (res.Items ?? []).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
    return ok({ items });
  } catch (err) {
    console.error("listGroups error", err);
    return serverError();
  }
};
