import { api } from "../api/client";

/** The current user's DM threads, newest activity first -> array. */
export const getConversations = async () => {
  const res = await api.get("/me/conversations");
  return res?.items ?? [];
};

/** Messages in one conversation, oldest first. Opening marks it read. */
export const getMessages = async (conversationId) => {
  const res = await api.get(
    `/me/conversations/${encodeURIComponent(conversationId)}/messages`
  );
  return res?.items ?? [];
};

/** Send a direct message to a user. Returns the created message. */
export const sendMessage = async (toUserId, content) =>
  api.post("/messages", { to: toUserId, content });

/** User directory for starting a chat; optional name/major search term. */
export const searchUsers = async (q = "") => {
  const res = await api.get(`/profiles${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  return res?.items ?? [];
};
