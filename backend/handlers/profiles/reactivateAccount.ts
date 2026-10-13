import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { ok, serverError, getUserId, type ApiEvent } from "../../shared/http.js";
import { AccountStatus, audit } from "../../shared/account.js";

const TABLE = process.env.PROFILES_TABLE!;

/**
 * POST /account/reactivate — restore a deactivated OR pending-deletion account
 * back to active (cancels a scheduled deletion if within the grace window).
 * SECURITY: userId from the verified JWT.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { userId },
        UpdateExpression: "SET #s = :s REMOVE deletedAt, deactivatedAt",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": AccountStatus.ACTIVE },
      })
    );
    await audit(userId, "account.reactivate");
    return ok({ status: AccountStatus.ACTIVE });
  } catch (err) {
    console.error("reactivateAccount error", err);
    return serverError();
  }
};
