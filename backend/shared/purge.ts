/** Pure helpers for the account purge (kept separate so they are unit-testable). */

/** Text that replaces the content of a message sent by a purged account. */
export const REMOVED_MESSAGE_CONTENT = "[message removed]";
/** Name shown in place of a purged account's name. */
export const DELETED_SENDER_NAME = "Deleted user";

/** S3 key scopes used by getUploadUrl: `<scope>/<userId>/<uuid>.<ext>`. */
export const UPLOAD_SCOPES = ["avatars", "posts", "files"] as const;

/** S3 key prefixes that hold a user's uploads. */
export function uploadPrefixes(userId: string): string[] {
  return UPLOAD_SCOPES.map((scope) => `${scope}/${userId}/`);
}

/** True when the message was sent by the purged user and so must be anonymized. */
export function shouldAnonymizeMessage(
  message: { senderId?: string },
  userId: string
): boolean {
  return message.senderId === userId;
}

/**
 * A conversation row is deleted (with all its messages) only when no other
 * participant still has a membership row; otherwise it stays for them.
 */
export function shouldDeleteConversation(otherMemberExists: boolean): boolean {
  return !otherMemberExists;
}

/** Conversation preview text after the purged user's last message is removed. */
export function anonymizedPreview(
  conversation: { lastSenderId?: string },
  userId: string
): { lastMessage: string } | null {
  return conversation.lastSenderId === userId
    ? { lastMessage: REMOVED_MESSAGE_CONTENT }
    : null;
}
