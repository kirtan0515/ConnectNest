import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock the service layer and auth so the component renders in isolation.
vi.mock("../../services/notificationServices", () => ({
  getNotifications: vi.fn(),
  markNotificationsRead: vi.fn(async () => ({ updated: 0 })),
}));
vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ user: { userId: "me" } }),
}));
vi.mock("../../realtime/useRealtime", () => ({ useRealtime: () => {} }));

import NotificationBell from "./NotificationBell";
import { getNotifications, markNotificationsRead } from "../../services/notificationServices";

const renderBell = () =>
  render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>
  );

describe("NotificationBell", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows the unread badge count", async () => {
    getNotifications.mockResolvedValue({
      items: [
        { notificationId: "1", message: "Amy liked your post", read: false, createdAt: new Date().toISOString() },
        { notificationId: "2", message: "Bob commented", read: false, createdAt: new Date().toISOString() },
      ],
      unreadCount: 2,
    });
    renderBell();
    expect(await screen.findByText("2")).toBeTruthy();
  });

  it("opens the panel and marks everything read", async () => {
    getNotifications.mockResolvedValue({
      items: [
        { notificationId: "1", message: "Amy liked your post", read: false, createdAt: new Date().toISOString() },
      ],
      unreadCount: 1,
    });
    renderBell();
    const btn = await screen.findByRole("button", { name: /notifications/i });
    fireEvent.click(btn);
    expect(await screen.findByText("Amy liked your post")).toBeTruthy();
    await waitFor(() => expect(markNotificationsRead).toHaveBeenCalled());
  });

  it("renders an empty state when there are no notifications", async () => {
    getNotifications.mockResolvedValue({ items: [], unreadCount: 0 });
    renderBell();
    const btn = await screen.findByRole("button", { name: /notifications/i });
    fireEvent.click(btn);
    expect(await screen.findByText(/all caught up/i)).toBeTruthy();
  });
});
