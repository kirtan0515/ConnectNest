import React from "react";
import { Link } from "react-router-dom";
import "./ConsentCheckbox.css";

export const CONSENT_ERROR =
  "Please confirm you are 18 or older and agree to the Terms and Privacy Policy.";

/** Required age + Terms/Privacy checkbox. `idPrefix` keeps ids unique per page. */
export default function ConsentCheckbox({ idPrefix, checked, onChange, error }) {
  const id = `${idPrefix}-consent`;
  const errId = `${id}-error`;
  return (
    <div className="consent">
      <label className="consent__row" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          className="consent__box"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-required="true"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errId : undefined}
        />
        <span className="consent__text">
          I am 18 or older, and I agree to the{" "}
          <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms</Link>
          {" "}and the{" "}
          <Link to="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
        </span>
      </label>
      {error && (
        <p id={errId} className="cn-alert cn-alert--error" role="alert">{error}</p>
      )}
    </div>
  );
}
