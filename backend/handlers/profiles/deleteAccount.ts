import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { ok, serverError, getUserId, type ApiEvent } from "../../shared/http.js";
import {
  AccountStatus,
  DELETION_GRACE_DAYS,
  audit,
} from "../../shared/account.js";

const TABLE = process.env.PROFILES_TABLE!;

/**
 * POST /account/delete — soft delete with a 30-day grace period.
 * Sets status=pending_deletion + deletedAt. The account is hidden immediately
 * (read paths treat it as gone) and logged out, but data is retained so the
 * user can RESTORE within the grace window. A scheduled job performs the hard
 * purge (DynamoDB rows + Cognito user) after the window elapses.
 * SECURITY: userId from the verified JWT.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const now = new Date();
    const purgeAfter = new Date(
      now.getTime() + DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000
    );

    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { userId },
        UpdateExpression:
          "SET #s = :s, deletedAt = :t, purgeAfter = :p",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":s": AccountStatus.PENDING_DELETION,
          ":t": now.toISOString(),
          ":p": purgeAfter.toISOString(),
        },
      })
    );
    await audit(userId, "account.delete.requested", {
      purgeAfter: purgeAfter.toISOString(),
    });

    return ok({
      status: AccountStatus.PENDING_DELETION,
      graceDays: DELETION_GRACE_DAYS,
      purgeAfter: purgeAfter.toISOString(),
    });
  } catch (err) {
    console.error("deleteAccount error", err);
    return serverError();
  }
};
