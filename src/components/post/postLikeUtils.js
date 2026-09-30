import { generateClient } from "aws-amplify/api";
import { listPostLikes } from "../../graphql/queries";
import { createPostLike, deletePostLike } from "../../graphql/mutations";

const client = generateClient();

export const fetchUserLike = async (postId, userId) => {
  const res = await client.graphql({
    query: listPostLikes,
    variables: {
      filter: {
        postId: { eq: postId },
        userId: { eq: userId },
      },
    },
    authMode: "userPool",
  });

  return res?.data?.listPostLikes?.items?.[0] || null;
};

export const toggleLike = async (postId, userId, existingLikeId) => {
  if (existingLikeId) {
    await client.graphql({
      query: deletePostLike,
      variables: { input: { id: existingLikeId } },
      authMode: "userPool",
    });
    return false;
  } else {
    const res = await client.graphql({
      query: createPostLike,
      variables: {
        input: {
          postId,
          userId,
          createdAt: new Date().toISOString(),
        },
      },
      authMode: "userPool",
    });
    // return the new like id so caller can store it for future unlike
    return res?.data?.createPostLike?.id || true;
  }
};
