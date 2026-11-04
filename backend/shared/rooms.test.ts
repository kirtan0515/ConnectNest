import { describe, it, expect } from "vitest";
import { requiresMembership } from "./rooms.js";

describe("requiresMembership", () => {
  it("does not require membership for the open rooms", () => {
    expect(requiresMembership("global")).toBe(false);
    expect(requiresMembership("chat-general")).toBe(false);
    expect(requiresMembership("  chat-general ")).toBe(false);
  });

  it("does not require membership when no group is given", () => {
    expect(requiresMembership(undefined)).toBe(false);
    expect(requiresMembership("")).toBe(false);
    expect(requiresMembership("   ")).toBe(false);
  });

  it("requires membership for any real group id", () => {
    expect(requiresMembership("3b897295-6fda-40c7-af63-b1b59fed1d01")).toBe(true);
    expect(requiresMembership("some-group")).toBe(true);
  });

  it("is not fooled by look-alike ids", () => {
    expect(requiresMembership("Chat-General")).toBe(true);
    expect(requiresMembership("chat-general2")).toBe(true);
    expect(requiresMembership("global ")).toBe(false); // trimmed
  });
});
