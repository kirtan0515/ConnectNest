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
| Comments | `postId` | `commentId` | — | authorId, authorName, content, createdAt |
| PostLikes | `postId` | `userId` | — | createdAt (prevents double-likes) |
| Groups | `groupId` (UUID) | — | — | name, description, ownerId, memberCount, createdAt |
| GroupMembers | `groupId` | `userId` | `byUser` (userId, groupId) | role (member/admin), joinedAt |

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
  groups would use the `byUser` GSI (planned follow-up).

## Notes on identity

`userId` and `ownerId`/`authorId` are always the Cognito `sub` taken from the
verified JWT. Clients never supply their own identity; this makes editing another
user's data impossible by construction.
