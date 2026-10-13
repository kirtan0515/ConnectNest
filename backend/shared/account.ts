import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "./db.js";

/** Account lifecycle states stored on the profile item's `status` field. */
export const AccountStatus = {
  ACTIVE: "active",
  DEACTIVATED: "deactivated",
  PENDING_DELETION: "pending_deletion",
} as const;
export type AccountStatusValue =
  (typeof AccountStatus)[keyof typeof AccountStatus];

/** Grace period before a soft-deleted account is permanently purged. */
export const DELETION_GRACE_DAYS = 30;

const AUDIT_TABLE = process.env.AUDIT_LOG_TABLE;

/**
 * Append an immutable audit record. Best-effort: a logging failure must never
 * block the primary action, so errors are swallowed (and logged to CloudWatch).
 */
export async function audit(
  userId: string,
  action: string,
  detail: Record<string, unknown> = {}
): Promise<void> {
  if (!AUDIT_TABLE) return;
  try {
    await ddb.send(
      new PutCommand({
        TableName: AUDIT_TABLE,
        Item: {
          userId,
          ts: new Date().toISOString(),
          action,
          detail,
        },
      })
    );
  } catch (err) {
    console.error("audit log write failed", { userId, action, err });
  }
}

/** True if a profile item represents an account that may use the app. */
export function isActive(profile: { status?: string } | undefined): boolean {
  if (!profile) return true; // no profile row yet = brand-new active user
  return (
    profile.status === undefined ||
    profile.status === AccountStatus.ACTIVE
  );
}
