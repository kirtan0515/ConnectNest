import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import {
  ok,
  notFound,
  badRequest,
  serverError,
  pathParam,
  type ApiEvent,
} from "../../shared/http.js";

const TABLE = process.env.GROUPS_TABLE!;

/** GET /groups/{groupId} */
export const handler = async (event: ApiEvent) => {
  try {
    const groupId = pathParam(event, "groupId");
    if (!groupId) return badRequest("Missing groupId");

    const res = await ddb.send(
      new GetCommand({ TableName: TABLE, Key: { groupId } })
    );
    if (!res.Item) return notFound("Group not found");
    return ok(res.Item);
  } catch (err) {
    console.error("getGroup error", err);
    return serverError();
  }
};
