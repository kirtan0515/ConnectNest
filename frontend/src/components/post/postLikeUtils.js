import { api } from "../../api/client";

/**
 * Toggle the current user's like on a post. The backend uses the JWT to
 * identify the user, so no userId is needed from the client.
 * Returns { liked, likeCount } from the server.
 */
export const toggleLike = async (postId) => {
  return api.post(`/posts/${postId}/like`, {});
};
