/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateComment = /* GraphQL */ `
  subscription OnCreateComment($filter: ModelSubscriptionCommentFilterInput) {
    onCreateComment(filter: $filter) {
      id
      postId
      content
      createdBy
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateComment = /* GraphQL */ `
  subscription OnUpdateComment($filter: ModelSubscriptionCommentFilterInput) {
    onUpdateComment(filter: $filter) {
      id
      postId
      content
      createdBy
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteComment = /* GraphQL */ `
  subscription OnDeleteComment($filter: ModelSubscriptionCommentFilterInput) {
    onDeleteComment(filter: $filter) {
      id
      postId
      content
      createdBy
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreatePostLike = /* GraphQL */ `
  subscription OnCreatePostLike($filter: ModelSubscriptionPostLikeFilterInput) {
    onCreatePostLike(filter: $filter) {
      id
      postId
      userId
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdatePostLike = /* GraphQL */ `
  subscription OnUpdatePostLike($filter: ModelSubscriptionPostLikeFilterInput) {
    onUpdatePostLike(filter: $filter) {
      id
      postId
      userId
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeletePostLike = /* GraphQL */ `
  subscription OnDeletePostLike($filter: ModelSubscriptionPostLikeFilterInput) {
    onDeletePostLike(filter: $filter) {
      id
      postId
      userId
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateRSVP = /* GraphQL */ `
  subscription OnCreateRSVP($filter: ModelSubscriptionRSVPFilterInput) {
    onCreateRSVP(filter: $filter) {
      id
      eventId
      userId
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateRSVP = /* GraphQL */ `
  subscription OnUpdateRSVP($filter: ModelSubscriptionRSVPFilterInput) {
    onUpdateRSVP(filter: $filter) {
      id
      eventId
      userId
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteRSVP = /* GraphQL */ `
  subscription OnDeleteRSVP($filter: ModelSubscriptionRSVPFilterInput) {
    onDeleteRSVP(filter: $filter) {
      id
      eventId
      userId
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateChatMessage = /* GraphQL */ `
  subscription OnCreateChatMessage(
    $filter: ModelSubscriptionChatMessageFilterInput
    $sender: String
  ) {
    onCreateChatMessage(filter: $filter, sender: $sender) {
      id
      content
      sender
      chatroomID
      timestamp
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateChatMessage = /* GraphQL */ `
  subscription OnUpdateChatMessage(
    $filter: ModelSubscriptionChatMessageFilterInput
    $sender: String
  ) {
    onUpdateChatMessage(filter: $filter, sender: $sender) {
      id
      content
      sender
      chatroomID
      timestamp
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteChatMessage = /* GraphQL */ `
  subscription OnDeleteChatMessage(
    $filter: ModelSubscriptionChatMessageFilterInput
    $sender: String
  ) {
    onDeleteChatMessage(filter: $filter, sender: $sender) {
      id
      content
      sender
      chatroomID
      timestamp
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateGroup = /* GraphQL */ `
  subscription OnCreateGroup(
    $filter: ModelSubscriptionGroupFilterInput
    $createdBy: String
  ) {
    onCreateGroup(filter: $filter, createdBy: $createdBy) {
      id
      name
      description
      members
      createdBy
      posts {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateGroup = /* GraphQL */ `
  subscription OnUpdateGroup(
    $filter: ModelSubscriptionGroupFilterInput
    $createdBy: String
  ) {
    onUpdateGroup(filter: $filter, createdBy: $createdBy) {
      id
      name
      description
      members
      createdBy
      posts {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteGroup = /* GraphQL */ `
  subscription OnDeleteGroup(
    $filter: ModelSubscriptionGroupFilterInput
    $createdBy: String
  ) {
    onDeleteGroup(filter: $filter, createdBy: $createdBy) {
      id
      name
      description
      members
      createdBy
      posts {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreatePost = /* GraphQL */ `
  subscription OnCreatePost(
    $filter: ModelSubscriptionPostFilterInput
    $createdBy: String
  ) {
    onCreatePost(filter: $filter, createdBy: $createdBy) {
      id
      content
      image
      createdAt
      updatedAt
      createdBy
      isPublic
      groupId
      likes {
        nextToken
        __typename
      }
      comments {
        nextToken
        __typename
      }
      __typename
    }
  }
`;
export const onUpdatePost = /* GraphQL */ `
  subscription OnUpdatePost(
    $filter: ModelSubscriptionPostFilterInput
    $createdBy: String
  ) {
    onUpdatePost(filter: $filter, createdBy: $createdBy) {
      id
      content
      image
      createdAt
      updatedAt
      createdBy
      isPublic
      groupId
      likes {
        nextToken
        __typename
      }
      comments {
        nextToken
        __typename
      }
      __typename
    }
  }
`;
export const onDeletePost = /* GraphQL */ `
  subscription OnDeletePost(
    $filter: ModelSubscriptionPostFilterInput
    $createdBy: String
  ) {
    onDeletePost(filter: $filter, createdBy: $createdBy) {
      id
      content
      image
      createdAt
      updatedAt
      createdBy
      isPublic
      groupId
      likes {
        nextToken
        __typename
      }
      comments {
        nextToken
        __typename
      }
      __typename
    }
  }
`;
export const onCreateEvent = /* GraphQL */ `
  subscription OnCreateEvent(
    $filter: ModelSubscriptionEventFilterInput
    $owner: String
  ) {
    onCreateEvent(filter: $filter, owner: $owner) {
      id
      title
      description
      date
      location
      organizer
      attendees
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdateEvent = /* GraphQL */ `
  subscription OnUpdateEvent(
    $filter: ModelSubscriptionEventFilterInput
    $owner: String
  ) {
    onUpdateEvent(filter: $filter, owner: $owner) {
      id
      title
      description
      date
      location
      organizer
      attendees
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onDeleteEvent = /* GraphQL */ `
  subscription OnDeleteEvent(
    $filter: ModelSubscriptionEventFilterInput
    $owner: String
  ) {
    onDeleteEvent(filter: $filter, owner: $owner) {
      id
      title
      description
      date
      location
      organizer
      attendees
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
