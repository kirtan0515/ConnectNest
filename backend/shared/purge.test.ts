import { describe, it, expect } from "vitest";
import {
  REMOVED_MESSAGE_CONTENT,
  uploadPrefixes,
  shouldAnonymizeMessage,
  shouldDeleteConversation,
  anonymizedPreview,
} from "./purge.js";

describe("account purge helpers", () => {
  it("lists the three upload prefixes for a user", () => {
    expect(uploadPrefixes("u1")).toEqual(["avatars/u1/", "posts/u1/", "files/u1/"]);
  });
  it("anonymizes only messages sent by the purged user", () => {
    expect(shouldAnonymizeMessage({ senderId: "u1" }, "u1")).toBe(true);
    expect(shouldAnonymizeMessage({ senderId: "u2" }, "u1")).toBe(false);
    expect(shouldAnonymizeMessage({}, "u1")).toBe(false);
  });
  it("deletes a conversation only when the other participant is gone", () => {
    expect(shouldDeleteConversation(false)).toBe(true);
    expect(shouldDeleteConversation(true)).toBe(false);
  });
  it("replaces the preview only when the purged user sent the last message", () => {
    expect(anonymizedPreview({ lastSenderId: "u1" }, "u1")).toEqual({
      lastMessage: REMOVED_MESSAGE_CONTENT,
    });
    expect(anonymizedPreview({ lastSenderId: "u2" }, "u1")).toBeNull();
  });
});
