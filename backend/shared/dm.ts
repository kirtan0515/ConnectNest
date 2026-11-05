/**
 * Direct-message helpers shared by the messaging handlers.
 *
 * A 1:1 conversation id is derived from the two participant ids, sorted, so the
 * same pair always resolves to the same conversation no matter who opens it:
 *   dm#<lowerId>#<higherId>
 * This makes "start or open a chat with X" idempotent without a lookup table.
 */
export function directConversationId(a: string, b: string): string {
  const [x, y] = [a, b].sort();
  return `dm#${x}#${y}`;
}

/** The two participant ids encoded in a 1:1 conversation id, or null. */
export function participantsOf(conversationId: string): [string, string] | null {
  if (!conversationId.startsWith("dm#")) return null;
  const parts = conversationId.slice(3).split("#");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

/** True if userId is one of the two participants in a 1:1 conversation id. */
export function isParticipant(conversationId: string, userId: string): boolean {
  const p = participantsOf(conversationId);
  return !!p && p.includes(userId);
}
