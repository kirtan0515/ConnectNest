import React from "react";

/**
 * Small decorative "nest" accent for the mobile auth screens.
 *
 * A lightweight inline SVG using brand colors only: one coral center node
 * ("you") with a few teal-tint satellite dots and thin connecting lines.
 * This stands in for the full AuthNetworkCanvas on phones (which is hidden
 * at the phone breakpoint). Purely decorative — aria-hidden.
 *
 * The optional center-node pulse is driven by the `.auth-nest__pulse` class
 * whose keyframes + prefers-reduced-motion guard live in auth-forms.css.
 */
const AuthNestAccent = () => (
  <svg
    className="auth-nest"
    viewBox="0 0 120 120"
    width="120"
    height="120"
    aria-hidden="true"
    focusable="false"
  >
    {/* connecting lines */}
    <g stroke="rgba(234,244,241,0.25)" strokeWidth="1.5" strokeLinecap="round">
      <line x1="60" y1="60" x2="26" y2="34" />
      <line x1="60" y1="60" x2="96" y2="40" />
      <line x1="60" y1="60" x2="40" y2="94" />
      <line x1="60" y1="60" x2="92" y2="90" />
    </g>

    {/* satellite dots — teal / lilac / green tints */}
    <circle cx="26" cy="34" r="7" fill="#8ec9ff" />
    <circle cx="96" cy="40" r="6" fill="#c8b8ff" />
    <circle cx="40" cy="94" r="6" fill="#b8e986" />
    <circle cx="92" cy="90" r="7" fill="#8ec9ff" />

    {/* center "you" node — coral */}
    <circle
      className="auth-nest__pulse"
      cx="60"
      cy="60"
      r="12"
      fill="#ff9f68"
    />
  </svg>
);

export default AuthNestAccent;
