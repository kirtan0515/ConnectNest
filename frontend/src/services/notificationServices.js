import { api } from "../api/client";

/** The current user's notifications, newest first -> { items, unreadCount }. */
export const getNotifications = async () => {
  const res = await api.get("/me/notifications");
  return { items: res?.items ?? [], unreadCount: res?.unreadCount ?? 0 };
};

/**
 * Mark notifications read. Pass an array of ids, or nothing to mark all read.
 */
export const markNotificationsRead = async (notificationIds) =>
  api.post("/me/notifications/read", notificationIds ? { notificationIds } : {});
