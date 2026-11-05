import { describe, it, expect } from "vitest";
import { directConversationId, participantsOf, isParticipant } from "./dm.js";

describe("direct conversation ids", () => {
  it("is deterministic regardless of argument order", () => {
    expect(directConversationId("alice", "bob")).toBe(
      directConversationId("bob", "alice")
    );
  });

  it("sorts the participants into the id", () => {
    expect(directConversationId("bob", "alice")).toBe("dm#alice#bob");
  });

  it("round-trips participants", () => {
    const id = directConversationId("u2", "u1");
    expect(participantsOf(id)).toEqual(["u1", "u2"]);
  });

  it("returns null for ids that are not 1:1 conversations", () => {
    expect(participantsOf("global")).toBeNull();
    expect(participantsOf("dm#only-one")).toBeNull();
    expect(participantsOf("dm##")).toBeNull();
  });

  it("authorizes only the two participants", () => {
    const id = directConversationId("alice", "bob");
    expect(isParticipant(id, "alice")).toBe(true);
    expect(isParticipant(id, "bob")).toBe(true);
    expect(isParticipant(id, "carol")).toBe(false);
    expect(isParticipant("not-a-dm", "alice")).toBe(false);
  });
});
