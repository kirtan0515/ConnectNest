import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../../shared/db.js";
import { ok, serverError, getUserId, type ApiEvent } from "../../shared/http.js";
import { AccountStatus, audit } from "../../shared/account.js";

const TABLE = process.env.PROFILES_TABLE!;

/**
 * POST /account/deactivate — reversible. Marks the profile deactivated and
 * logs the user out client-side. Logging back in / restoring reactivates it.
 * SECURITY: userId from the verified JWT.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { userId },
        UpdateExpression: "SET #s = :s, deactivatedAt = :t",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":s": AccountStatus.DEACTIVATED,
          ":t": new Date().toISOString(),
        },
      })
    );
    await audit(userId, "account.deactivate");
    return ok({ status: AccountStatus.DEACTIVATED });
  } catch (err) {
    console.error("deactivateAccount error", err);
    return serverError();
  }
};
