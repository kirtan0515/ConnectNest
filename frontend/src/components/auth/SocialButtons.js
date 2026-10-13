import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import "./SocialButtons.css";

/** "Sign in with Google / Microsoft" buttons + a divider. Hidden if social
 *  login isn't configured (no Hosted UI domain in env). */
const SocialButtons = ({ label = "or continue with" }) => {
  const { loginWithGoogle, loginWithMicrosoft, socialLoginEnabled } = useAuth();
  const [busy, setBusy] = useState("");

  if (!socialLoginEnabled) return null;

  const go = (provider, fn) => async () => {
    setBusy(provider);
    try {
      await fn();
    } catch (e) {
      setBusy("");
    }
  };

  return (
    <div className="social">
      <div className="social__divider"><span>{label}</span></div>
      <div className="social__buttons">
        <button
          type="button"
          className="social__btn"
          onClick={go("google", loginWithGoogle)}
          disabled={!!busy}
        >
          <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z"/>
            <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 010-3.44V4.95H.96a9 9 0 000 8.1l3.01-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 00.96 4.95L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          {busy === "google" ? "Redirecting…" : "Google"}
        </button>

        <button
          type="button"
          className="social__btn"
          onClick={go("microsoft", loginWithMicrosoft)}
          disabled={!!busy}
        >
          <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
            <path fill="#F25022" d="M0 0h8.5v8.5H0z"/>
            <path fill="#7FBA00" d="M9.5 0H18v8.5H9.5z"/>
            <path fill="#00A4EF" d="M0 9.5h8.5V18H0z"/>
            <path fill="#FFB900" d="M9.5 9.5H18V18H9.5z"/>
          </svg>
          {busy === "microsoft" ? "Redirecting…" : "Microsoft"}
        </button>
      </div>
    </div>
  );
};

export default SocialButtons;
