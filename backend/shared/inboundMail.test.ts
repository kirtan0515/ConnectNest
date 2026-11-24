import { describe, it, expect } from "vitest";
import {
  splitMessage,
  extractAddress,
  rewriteForForwarding,
  isUnsafe,
} from "./inboundMail";

const OPTS = {
  fromAddress: "no-reply@connectnestapp.com",
  forwardTo: "owner@example.com",
};

const RAW = [
  "Return-Path: <alice@sender.test>",
  "Received: from mx.sender.test by inbound-smtp.us-east-1.amazonaws.com",
  "DKIM-Signature: v=1; a=rsa-sha256; d=sender.test;",
  "\tb=abc",
  'From: "Alice A" <alice@sender.test>',
  "To: support@connectnestapp.com",
  "Subject: Hello",
  "Message-ID: <1@sender.test>",
  "MIME-Version: 1.0",
  "Content-Type: text/plain; charset=UTF-8",
  "",
  "Body line 1",
  "",
  "Body line 2",
].join("\r\n");

describe("splitMessage", () => {
  it("unfolds continuation lines into one header entry", () => {
    const { headers, body } = splitMessage(RAW);
    expect(headers.find((h) => h.startsWith("DKIM-Signature"))).toContain(
      "\r\n\tb=abc",
    );
    expect(body).toBe("Body line 1\r\n\r\nBody line 2");
  });
});

describe("extractAddress", () => {
  it("handles angle and bare forms and rejects junk", () => {
    expect(extractAddress('"A B" <a@b.test>')).toBe("a@b.test");
    expect(extractAddress("a@b.test")).toBe("a@b.test");
    expect(extractAddress("no address")).toBeUndefined();
    expect(extractAddress(undefined)).toBeUndefined();
  });
});

describe("rewriteForForwarding", () => {
  it("rewrites From, sets Reply-To to the sender and drops auth headers", () => {
    const { raw, originalSender } = rewriteForForwarding(
      RAW,
      "support@connectnestapp.com",
      OPTS,
    );
    const { headers, body } = splitMessage(raw);
    expect(originalSender).toBe("alice@sender.test");
    expect(headers[0]).toBe(
      'From: "alice@sender.test via ConnectNest" <no-reply@connectnestapp.com>',
    );
    expect(headers).toContain("To: owner@example.com");
    expect(headers).toContain("Reply-To: alice@sender.test");
    expect(raw).not.toMatch(/DKIM-Signature/i);
    expect(raw).not.toMatch(/Return-Path/i);
    expect(raw).not.toMatch(/Message-ID/i);
    expect(raw.match(/^From:/gim)).toHaveLength(1);
    expect(headers).toContain("Subject: Hello");
    expect(headers).toContain("Content-Type: text/plain; charset=UTF-8");
    expect(body).toBe("Body line 1\r\n\r\nBody line 2");
  });

  it("prefers the original Reply-To", () => {
    const withReplyTo = RAW.replace(
      "Subject: Hello",
      "Reply-To: Bob <bob@other.test>\r\nSubject: Hello",
    );
    const { raw } = rewriteForForwarding(withReplyTo, "abuse@x.test", OPTS);
    expect(raw).toContain("Reply-To: bob@other.test");
    expect(raw).not.toContain("Reply-To: alice@");
  });

  it("cannot be header-injected through the display name", () => {
    const evil = RAW.replace(
      'From: "Alice A" <alice@sender.test>',
      "From: <a@b.test>\r\n Bcc: x@y.test",
    );
    const { raw } = rewriteForForwarding(evil, "support@x.test", OPTS);
    const { headers } = splitMessage(raw);
    expect(headers.filter((h) => /^bcc:/i.test(h))).toHaveLength(0);
  });
});

describe("isUnsafe", () => {
  it("flags spam or virus FAIL only", () => {
    expect(isUnsafe({ spamVerdict: { status: "FAIL" } })).toBe(true);
    expect(isUnsafe({ virusVerdict: { status: "FAIL" } })).toBe(true);
    expect(
      isUnsafe({
        spamVerdict: { status: "PASS" },
        virusVerdict: { status: "GRAY" },
      }),
    ).toBe(false);
  });
});
