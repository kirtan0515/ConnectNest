# ConnectNest — Data Model

One DynamoDB table per entity. All tables use on-demand billing
(`PAY_PER_REQUEST`) and `RemovalPolicy.DESTROY` (student/portfolio project —
switch to `RETAIN` for production data).

| Table | Partition Key | Sort Key | GSIs | Attributes |
|---|---|---|---|---|
| Profiles | `userId` (Cognito sub) | — | — | email, name, major, interests[], bio, avatarKey, updatedAt |
| Events | `eventId` (UUID) | — | `byOwner` (ownerId, createdAt) | title, description, location, startsAt, ownerId, ownerName, imageKey, createdAt |
| RSVPs | `eventId` | `userId` | `byUser` (userId, eventId) | status (going/interested) |
| Posts | `postId` (UUID) | — | `byGroup` (groupId, createdAt) | authorId, authorName, content, groupId, imageKey, likeCount, createdAt |
| Comments | `postId` | `commentId` | — | authorId, authorName, content, createdAt, editedAt |
| PostLikes | `postId` | `userId` | — | createdAt (prevents double-likes) |
| Groups | `groupId` (UUID) | — | — | name, description, ownerId, memberCount, createdAt |
| GroupMembers | `groupId` | `userId` | `byUser` (userId, groupId) | role (member/admin), joinedAt |
| AuditLog | `userId` | `timestamp` | — | action (deactivate/delete/reactivate/purge), detail, createdAt |
| Connections | `connectionId` | — | — | userId, ttl (auto-expire stale WebSocket connections) |
| Notifications | `userId` (recipient) | `notificationId` (`<ts>#<uuid>`) | — | type, actorId, actorName, message, link, read, createdAt, ttl (90-day expiry) |

The AuditLog table (account lifecycle) and Connections table (real-time
WebSocket push) live in `ConnectNest-Data` and `ConnectNest-Realtime`
respectively.

## Access patterns

- **Profile by user** — `GetItem` on Profiles by `userId`.
- **Events (feed)** — `Scan` Events, sorted by `createdAt` (demo scale). Owner's
  events via the `byOwner` GSI.
- **Posts (global feed)** — `Scan` Posts. Group/chat posts via the `byGroup` GSI
  (`groupId` = a group id, `"global"`, or `"chat-general"` for the chat room).
- **Comments on a post** — `Query` Comments by `postId`.
- **Like toggle** — check PostLikes (`postId`,`userId`); write/delete the like row
  and atomically `ADD` to Posts.likeCount.
- **Group membership** — `Put` a GroupMembers row (`groupId`,`userId`). A user's
  groups ("my groups") use the `byUser` GSI (`GET /me/groups`); group members
  list via `Query` on `groupId` (`GET /groups/{groupId}/members`).
- **Group-scoped posting** — `createPost` verifies a GroupMembers row exists for
  (`groupId`,`userId`) before allowing a post to a group (403 otherwise).
- **Account lifecycle** — writes an AuditLog row per action; the scheduled purge
  hard-deletes a user's rows across all tables + Cognito after the grace period.
- **Real-time push** — `$connect` stores `connectionId` (+ `userId`) in
  Connections; `createPost`/`createEvent` scan Connections and push the new item
  to each via the API Gateway Management API; stale rows (410 Gone) are pruned.

## Notes on identity

`userId` and `ownerId`/`authorId` are always the Cognito `sub` taken from the
verified JWT. Clients never supply their own identity; this makes editing another
user's data impossible by construction.
