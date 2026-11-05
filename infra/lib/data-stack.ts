import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  AttributeType,
  BillingMode,
  Table,
  ProjectionType,
} from "aws-cdk-lib/aws-dynamodb";

/**
 * DataStack — one DynamoDB table per entity.
 *
 * Design notes:
 * - PAY_PER_REQUEST (on-demand) keeps cost near-zero at demo scale.
 * - RemovalPolicy.DESTROY for a student/portfolio project so `cdk destroy`
 *   leaves nothing behind. Switch to RETAIN for real production data.
 * - GSIs mirror the access patterns documented in docs/data-model.md.
 */
export class DataStack extends Stack {
  public readonly profilesTable: Table;
  public readonly eventsTable: Table;
  public readonly rsvpsTable: Table;
  public readonly postsTable: Table;
  public readonly commentsTable: Table;
  public readonly postLikesTable: Table;
  public readonly groupsTable: Table;
  public readonly groupMembersTable: Table;
  public readonly auditLogTable: Table;
  public readonly notificationsTable: Table;
  public readonly conversationsTable: Table;
  public readonly conversationMembersTable: Table;
  public readonly messagesTable: Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const common = {
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    };

    // Profiles: PK userId (Cognito sub).
    // GSI byStatus lets the scheduled purge job query profiles whose account
    // lifecycle status is "pending_deletion" without scanning the whole table.
    this.profilesTable = new Table(this, "ProfilesTable", {
      partitionKey: { name: "userId", type: AttributeType.STRING },
      ...common,
    });
    this.profilesTable.addGlobalSecondaryIndex({
      indexName: "byStatus",
      partitionKey: { name: "status", type: AttributeType.STRING },
      sortKey: { name: "deletedAt", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // Events: PK eventId (UUID); GSI byOwner (ownerId, createdAt)
    this.eventsTable = new Table(this, "EventsTable", {
      partitionKey: { name: "eventId", type: AttributeType.STRING },
      ...common,
    });
    this.eventsTable.addGlobalSecondaryIndex({
      indexName: "byOwner",
      partitionKey: { name: "ownerId", type: AttributeType.STRING },
      sortKey: { name: "createdAt", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // RSVPs: PK eventId, SK userId; GSI byUser (userId)
    this.rsvpsTable = new Table(this, "RsvpsTable", {
      partitionKey: { name: "eventId", type: AttributeType.STRING },
      sortKey: { name: "userId", type: AttributeType.STRING },
      ...common,
    });
    this.rsvpsTable.addGlobalSecondaryIndex({
      indexName: "byUser",
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "eventId", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // Posts: PK postId (UUID); GSI byGroup (groupId, createdAt)
    this.postsTable = new Table(this, "PostsTable", {
      partitionKey: { name: "postId", type: AttributeType.STRING },
      ...common,
    });
    this.postsTable.addGlobalSecondaryIndex({
      indexName: "byGroup",
      partitionKey: { name: "groupId", type: AttributeType.STRING },
      sortKey: { name: "createdAt", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });
    // byAuthor lets a profile page fetch one user's posts without reading the
    // whole feed and filtering in the browser.
    this.postsTable.addGlobalSecondaryIndex({
      indexName: "byAuthor",
      partitionKey: { name: "authorId", type: AttributeType.STRING },
      sortKey: { name: "createdAt", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // Comments: PK postId, SK commentId
    this.commentsTable = new Table(this, "CommentsTable", {
      partitionKey: { name: "postId", type: AttributeType.STRING },
      sortKey: { name: "commentId", type: AttributeType.STRING },
      ...common,
    });

    // PostLikes: PK postId, SK userId (prevents double-likes)
    this.postLikesTable = new Table(this, "PostLikesTable", {
      partitionKey: { name: "postId", type: AttributeType.STRING },
      sortKey: { name: "userId", type: AttributeType.STRING },
      ...common,
    });

    // Groups: PK groupId (UUID)
    this.groupsTable = new Table(this, "GroupsTable", {
      partitionKey: { name: "groupId", type: AttributeType.STRING },
      ...common,
    });

    // GroupMembers: PK groupId, SK userId; GSI byUser (userId)
    this.groupMembersTable = new Table(this, "GroupMembersTable", {
      partitionKey: { name: "groupId", type: AttributeType.STRING },
      sortKey: { name: "userId", type: AttributeType.STRING },
      ...common,
    });
    this.groupMembersTable.addGlobalSecondaryIndex({
      indexName: "byUser",
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "groupId", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // AuditLog: PK userId, SK ts (ISO timestamp). Immutable record of account
    // lifecycle + security-relevant actions (deactivate/delete/restore/purge).
    this.auditLogTable = new Table(this, "AuditLogTable", {
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "ts", type: AttributeType.STRING },
      ...common,
    });

    // Notifications: PK userId (recipient), SK notificationId ("<ts>#<uuid>" so
    // a Query returns newest-last and stays unique). Each row records who did
    // what on which entity, plus a read flag. Old rows expire via `ttl`.
    this.notificationsTable = new Table(this, "NotificationsTable", {
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "notificationId", type: AttributeType.STRING },
      timeToLiveAttribute: "ttl",
      ...common,
    });

    // ---- Direct messaging ----
    // Conversations: PK conversationId. For a 1:1 chat the id is derived from the
    // sorted pair of user ids ("dm#<a>#<b>"), so the same two people always map
    // to one conversation. Holds participant ids + a denormalized last message.
    this.conversationsTable = new Table(this, "ConversationsTable", {
      partitionKey: { name: "conversationId", type: AttributeType.STRING },
      ...common,
    });

    // ConversationMembers: PK userId, SK conversationId. One row per participant
    // per conversation; `lastMessageAt` is kept here so "my conversations" sorts
    // without reading the Conversations table, and `lastReadAt` drives unread.
    // GSI byConversation lists a conversation's participants for fan-out.
    this.conversationMembersTable = new Table(this, "ConversationMembersTable", {
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "conversationId", type: AttributeType.STRING },
      ...common,
    });
    this.conversationMembersTable.addGlobalSecondaryIndex({
      indexName: "byConversation",
      partitionKey: { name: "conversationId", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // Messages: PK conversationId, SK messageId ("<ts>#<uuid>"), so a Query
    // returns chronological order and stays unique.
    this.messagesTable = new Table(this, "MessagesTable", {
      partitionKey: { name: "conversationId", type: AttributeType.STRING },
      sortKey: { name: "messageId", type: AttributeType.STRING },
      ...common,
    });
  }
}
