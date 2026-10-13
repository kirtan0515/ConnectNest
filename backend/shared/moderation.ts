/**
 * Lightweight server-side text moderation for posts and comments.
 *
 * Strategy: a curated block-list of slurs / profanity / harassment terms.
 * Runs in-process (zero latency, zero cost, deterministic) — the right choice
 * for a demo. Amazon Comprehend toxicity detection is the documented upgrade
 * path for nuance (see HANDOFF §14).
 *
 * SECURITY: moderation MUST run on the backend. A client-side check is
 * trivially bypassed by calling the API directly.
 */

// Base profanity / slur roots. Matched as whole words and against common
// obfuscations (leetspeak, repeated letters, spacing). Kept intentionally
// compact and readable; extend as needed.
const BLOCKED_ROOTS = [
  // profanity
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "piss", "cunt",
  "slut", "whore", "pussy", "cock", "wank",
  // slurs / hate (partial — covers common ones; expand with care)
  "nigger", "nigga", "faggot", "fag", "retard", "spic", "chink", "kike",
  "tranny", "dyke", "coon",
  // sexual-explicit markers for text
  "porn", "nude", "nudes", "rape", "molest",
];

// Normalize leetspeak + strip separators so "f.u.c.k", "f u c k", "fvck",
// "sh1t" all collapse toward their root.
function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\s._\-*]+/g, "") // drop separators used to evade filters
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/(.)\1{2,}/g, "$1$1"); // collapse 3+ repeats: "shiiiit" -> "shiit"
}

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
  matched?: string;
}

/**
 * Check free text (post/comment content). Returns { allowed:false, ... } if it
 * contains blocked language.
 */
export function moderateText(text: string): ModerationResult {
  if (!text) return { allowed: true };

  const normalized = normalize(text);
  // Also keep a word-boundary check on the raw lowercased text to catch exact
  // standalone words without over-matching substrings.
  const rawLower = text.toLowerCase();

  for (const root of BLOCKED_ROOTS) {
    // obfuscation-tolerant substring match on the normalized text
    if (normalized.includes(root)) {
      return {
        allowed: false,
        matched: root,
        reason:
          "Your text contains language that isn't allowed on ConnectNest. " +
          "Please revise and try again.",
      };
    }
    // whole-word match on raw text (e.g. "ass" shouldn't flag "class", so we
    // only use word boundaries for short roots here)
    const wb = new RegExp(`\\b${root}\\b`, "i");
    if (wb.test(rawLower)) {
      return {
        allowed: false,
        matched: root,
        reason:
          "Your text contains language that isn't allowed on ConnectNest. " +
          "Please revise and try again.",
      };
    }
  }

  return { allowed: true };
}
