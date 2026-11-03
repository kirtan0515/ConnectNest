import { describe, it, expect } from "vitest";
import { moderateText } from "./moderation.js";

describe("moderateText", () => {
  it("allows clean text and empty input", () => {
    expect(moderateText("Looking forward to the robotics meetup!").allowed).toBe(true);
    expect(moderateText("").allowed).toBe(true);
  });

  it("blocks plain profanity", () => {
    const r = moderateText("this is shit");
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/isn't allowed/i);
  });

  it("catches common leetspeak / separator evasions", () => {
    expect(moderateText("sh1t").allowed).toBe(false);
    expect(moderateText("f.u.c.k").allowed).toBe(false);
    expect(moderateText("f u c k").allowed).toBe(false);
  });

  it("does not over-match clean words that contain a short root", () => {
    // "ass" is not in the list, but guard against substring false positives
    // on words like "class" / "pass" for roots that are present.
    expect(moderateText("Please pass the notes after class").allowed).toBe(true);
    expect(moderateText("We assess assignments on campus").allowed).toBe(true);
  });

  it("reports which root matched", () => {
    const r = moderateText("you bastard");
    expect(r.allowed).toBe(false);
    expect(r.matched).toBe("bastard");
  });
});
