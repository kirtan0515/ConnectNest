/**
 * Open rooms: values of `groupId` on a post that are NOT real groups and so have
 * no membership list. Anyone signed in may post to them.
 *
 *   "global"        the main campus feed
 *   "chat-general"  the shared room behind the Messages page
 *
 * Any other groupId is a real group and requires membership to post.
 */
export const OPEN_ROOMS: ReadonlySet<string> = new Set(["global", "chat-general"]);

export function requiresMembership(groupId: string | undefined): boolean {
  const id = groupId?.trim();
  return !!id && !OPEN_ROOMS.has(id);
}
