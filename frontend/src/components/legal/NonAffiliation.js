import React from "react";
import "./NonAffiliation.css";

/** Single source of wording for the non-affiliation statement. */
export const NON_AFFILIATION_TEXT =
  "ConnectNest is an independent student capstone project by Kirtan Patel. " +
  "It is not affiliated with, sponsored by, or endorsed by Harrisburg University.";

export default function NonAffiliation({ compact = false, className = "" }) {
  return (
    <p className={`non-affil${compact ? " non-affil--compact" : ""} ${className}`.trim()}>
      {NON_AFFILIATION_TEXT}
    </p>
  );
}
