/**
 * Pure helpers for forwarding inbound SES mail. No AWS calls here.
 *
 * Forwarding re-sends the stored raw message through SES. To keep SPF, DKIM
 * and DMARC passing for connectnestapp.com, the From header is rewritten to
 * the domain's own no-reply address, the original sender moves to Reply-To,
 * and the original DKIM/auth headers are dropped (they no longer validate).
 */

/** Headers removed from the original message before re-sending. */
const STRIPPED_HEADERS = new Set([
  "from",
  "sender",
  "reply-to",
  "return-path",
  "to",
  "cc",
  "bcc",
  "message-id",
  "dkim-signature",
  "domainkey-signature",
  "arc-seal",
  "arc-message-signature",
  "arc-authentication-results",
  "authentication-results",
  "received-spf",
  "x-ses-receipt",
  "x-ses-dkim-signature",
  "x-ses-outgoing",
  "dmarc-filter",
]);

export interface SplitMessage {
  /** Header fields, each with folded continuation lines kept inside one entry. */
  headers: string[];
  /** Everything after the blank line that ends the header block. */
  body: string;
}

export function splitMessage(raw: string): SplitMessage {
  const match = /\r?\n\r?\n/.exec(raw);
  const headerText = match ? raw.slice(0, match.index) : raw;
  const body = match ? raw.slice(match.index + match[0].length) : "";
  const headers: string[] = [];
  for (const line of headerText.split(/\r?\n/)) {
    if (/^[ \t]/.test(line) && headers.length > 0) {
      headers[headers.length - 1] += `\r\n${line}`;
    } else if (line.length > 0) {
      headers.push(line);
    }
  }
  return { headers, body };
}

function headerName(field: string): string {
  const idx = field.indexOf(":");
  return (idx === -1 ? field : field.slice(0, idx)).trim().toLowerCase();
}

function headerValue(field: string): string {
  const idx = field.indexOf(":");
  return idx === -1
    ? ""
    : field
        .slice(idx + 1)
        .replace(/\r?\n[ \t]+/g, " ")
        .trim();
}

export function getHeader(headers: string[], name: string): string | undefined {
  const field = headers.find((h) => headerName(h) === name.toLowerCase());
  return field === undefined ? undefined : headerValue(field);
}

/** Pulls a bare address out of a header value such as `Name <a@b.com>`. */
export function extractAddress(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const angle = /<([^<>\s]+@[^<>\s]+)>/.exec(value);
  const candidate = angle
    ? angle[1]
    : /([^\s<>",;()]+@[^\s<>",;()]+)/.exec(value)?.[1];
  if (!candidate) return undefined;
  return /^[^\s@]+@[^\s@]+$/.test(candidate) ? candidate : undefined;
}

/** Keeps a display name safe for a quoted-string header: printable ASCII only. */
function safeDisplay(text: string): string {
  return text.replace(/[^\x20-\x7e]/g, "").replace(/["\\<>]/g, "");
}

export interface RewriteOptions {
  /** Address the forwarded copy is sent from (an SES-verified identity). */
  fromAddress: string;
  /** Destination inbox. */
  forwardTo: string;
}

export interface RewriteResult {
  raw: string;
  originalSender: string | undefined;
}

/** Builds the forwarded raw message from the stored original. */
export function rewriteForForwarding(
  rawMessage: string,
  originalRecipient: string,
  opts: RewriteOptions,
): RewriteResult {
  const { headers, body } = splitMessage(rawMessage);
  const originalFrom = getHeader(headers, "from");
  const originalReplyTo = getHeader(headers, "reply-to");
  const senderAddress = extractAddress(originalFrom);
  const replyTo = extractAddress(originalReplyTo) ?? senderAddress;

  const kept = headers.filter((h) => !STRIPPED_HEADERS.has(headerName(h)));
  const label = safeDisplay(senderAddress ?? "unknown sender");
  const added = [
    `From: "${label} via ConnectNest" <${opts.fromAddress}>`,
    `To: ${opts.forwardTo}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `X-ConnectNest-Original-To: ${safeDisplay(originalRecipient)}`,
  ];
  return {
    raw: [...added, ...kept].join("\r\n") + "\r\n\r\n" + body,
    originalSender: senderAddress,
  };
}

/** SES verdict statuses: PASS, FAIL, GRAY, PROCESSING_FAILED, DISABLED. */
export function isUnsafe(verdicts: {
  spamVerdict?: { status?: string };
  virusVerdict?: { status?: string };
}): boolean {
  return (
    verdicts.spamVerdict?.status === "FAIL" ||
    verdicts.virusVerdict?.status === "FAIL"
  );
}
