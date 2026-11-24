import React from "react";
import "./InitialsAvatar.css";

// Light backgrounds paired with dark pine text (contrast well above 4.5:1).
const PALETTE = ["#ff9f68", "#8ec9ff", "#c8b8ff", "#b8e986", "#ffbe94", "#a3dcd0"];

/** First + last initial, uppercased. "U" when the name is empty. */
export function initialsFor(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const first = Array.from(parts[0])[0] || "";
  const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : "";
  return (first + last).toUpperCase();
}

/** Deterministic palette colour for a name. */
export function colorFor(name) {
  const s = (name || "").trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Locally rendered initials avatar. No network requests. */
export default function InitialsAvatar({ name, size = 40, decorative = false, className = "" }) {
  const a11y = decorative
    ? { "aria-hidden": "true" }
    : { role: "img", "aria-label": name || "User" };
  return (
    <span
      className={`initials-avatar ${className}`.trim()}
      style={{
        width: size,
        height: size,
        background: colorFor(name),
        fontSize: Math.round(size * 0.4),
      }}
      {...a11y}
    >
      {initialsFor(name)}
    </span>
  );
}
