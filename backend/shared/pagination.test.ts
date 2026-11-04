import { describe, it, expect } from "vitest";
import {
  encodeToken,
  decodeToken,
  clampLimit,
  InvalidTokenError,
} from "./pagination.js";

const KEYS = ["postId", "groupId", "createdAt"];
const key = { postId: "p1", groupId: "global", createdAt: "2026-01-01T00:00:00Z" };

describe("pagination tokens", () => {
  it("round-trips a valid key", () => {
    expect(decodeToken(encodeToken(key), KEYS)).toEqual(key);
  });

  it("returns undefined when there is no token / no more pages", () => {
    expect(encodeToken(undefined)).toBeUndefined();
    expect(decodeToken(undefined, KEYS)).toBeUndefined();
  });

  it("rejects garbage that is not base64 JSON", () => {
    expect(() => decodeToken("%%%not-a-token%%%", KEYS)).toThrow(InvalidTokenError);
  });

  it("rejects non-object payloads", () => {
    const arr = Buffer.from(JSON.stringify(["a"])).toString("base64url");
    const str = Buffer.from(JSON.stringify("hi")).toString("base64url");
    expect(() => decodeToken(arr, KEYS)).toThrow(InvalidTokenError);
    expect(() => decodeToken(str, KEYS)).toThrow(InvalidTokenError);
  });

  it("rejects keys outside the allow-list (no attribute smuggling)", () => {
    const evil = encodeToken({ ...key, authorId: "someone-else" });
    expect(() => decodeToken(evil, KEYS)).toThrow(InvalidTokenError);
  });

  it("rejects non-string values", () => {
    const bad = encodeToken({ ...key, createdAt: { S: "x" } });
    expect(() => decodeToken(bad, KEYS)).toThrow(InvalidTokenError);
  });

  it("rejects a token missing a required key", () => {
    const partial = encodeToken({ postId: "p1", groupId: "global" });
    expect(() => decodeToken(partial, KEYS)).toThrow(InvalidTokenError);
  });
});

describe("clampLimit", () => {
  it("defaults when missing or invalid", () => {
    expect(clampLimit(undefined)).toBe(50);
    expect(clampLimit("abc")).toBe(50);
    expect(clampLimit("0")).toBe(50);
    expect(clampLimit("-5")).toBe(50);
  });

  it("honors a sensible value and caps the maximum", () => {
    expect(clampLimit("20")).toBe(20);
    expect(clampLimit("100")).toBe(100);
    expect(clampLimit("100000")).toBe(100);
  });
});
