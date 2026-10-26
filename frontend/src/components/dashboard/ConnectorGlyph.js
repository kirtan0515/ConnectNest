import React from "react";

/**
 * ConnectorGlyph — the brand's bespoke "connection" mark: two small nodes
 * joined by a short line, in brand colors (coral + teal-ish). Decorative only
 * (aria-hidden), subtle, no animation. Used before section titles and in
 * empty states so the campus-network "connecting" metaphor threads through
 * the page as a quiet repeated mark.
 *
 * Renders with explicit brand hexes so it reads on both the dark dashboard
 * scope and the light /profile /events theme.
 *
 * Props:
 *   size — px (default 16; ~28 for empty states)
 *   className — passthrough for layout/spacing
 */
export default function ConnectorGlyph({ size = 16, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* connecting line */}
      <line
        x1="7.5"
        y1="7.5"
        x2="16.5"
        y2="16.5"
        stroke="#8ec9ff"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* two nodes */}
      <circle cx="6" cy="6" r="3.25" fill="#ff9f68" />
      <circle cx="18" cy="18" r="3.25" fill="#8ec9ff" />
    </svg>
  );
}
