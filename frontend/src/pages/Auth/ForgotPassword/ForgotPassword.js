import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import AuthNetworkCanvas from "../../../components/canvas/AuthNetworkCanvas";
import logo from "../../../assets/connectnest-logo.png";
import "../Login/Login.css";

function friendlyError(err) {
  const msg = (err && err.message) || "";
  const name = (err && err.name) || "";
  if (name === "UserNotFoundException")
    return "We couldn't find an account with that email.";
  if (name === "CodeMismatchException")
    return "That code doesn't match. Check the email and try again.";
  if (name === "InvalidPasswordException")
    return "That password doesn't meet the requirements (8+ chars, upper, lower, number).";
  if (name === "LimitExceededException")
    return "Too many attempts. Please wait a bit and try again.";
  if (/network|failed to fetch/i.test(msg))
    return "Network trouble. Check your connection and try again.";
  return msg || "Something went wrong. Please try again.";
}

const ForgotPassword = () => {
  const { forgotPassword, confirmForgotPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("request"); // request | reset | done
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (email.indexOf("@") < 1) {
      setError("Enter the university email on your account.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await forgotPassword({ email: email.trim() });
      setStep("reset");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (code.length < 6) {
      setError("Enter the 6-digit code we emailed you.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await confirmForgotPassword({ email: email.trim(), code: code.trim(), newPassword });
      setStep("done");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cn-scope auth">
      <div className="auth__visual auth__visual--login">
        <AuthNetworkCanvas />
        <Link to="/" className="auth__logo">
          <img src={logo} alt="ConnectNest" />
        </Link>
        <p className="auth__caption">Let's get you back into your account.</p>
      </div>

      <div className="auth__panel auth__panel--login">
        {step === "request" && (
          <form className="auth__form" onSubmit={handleRequest} noValidate>
            <div className="auth__head">
              <h1 className="cn-head auth__title">Reset your password</h1>
              <p className="auth__subtitle">
                Enter your university email and we'll send you a reset code.
              </p>
            </div>
            <label className="cn-label" htmlFor="fp-email">
              University email
              <input
                id="fp-email"
                className="cn-input"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
              />
            </label>
            {error && <p className="cn-alert cn-alert--error" role="alert">{error}</p>}
            <button type="submit" className="cn-btn cn-btn--primary auth__submit" disabled={busy}>
              {busy ? "Sending…" : "Send reset code"}
            </button>
            <p className="auth__switch">
              Remembered it? <Link to="/login">Back to log in</Link>
            </p>
          </form>
        )}

        {step === "reset" && (
          <form className="auth__form" onSubmit={handleReset} noValidate>
            <div className="auth__head">
              <h1 className="cn-head auth__title">Enter your new password</h1>
              <p className="auth__subtitle">
                We sent a 6-digit code to {email}.
              </p>
            </div>
            <label className="cn-label" htmlFor="fp-code">
              Reset code
              <input
                id="fp-code"
                className="cn-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6)); setError(""); }}
              />
            </label>
            <label className="cn-label" htmlFor="fp-new">
              New password
              <span className="auth__pw-wrap">
                <input
                  id="fp-new"
                  className="cn-input auth__pw-input"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                />
                <button
                  type="button"
                  className="auth__pw-toggle"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </span>
            </label>
            {error && <p className="cn-alert cn-alert--error" role="alert">{error}</p>}
            <button type="submit" className="cn-btn cn-btn--primary auth__submit" disabled={busy}>
              {busy ? "Resetting…" : "Reset password"}
            </button>
            <p className="auth__switch">
              <Link to="/login">Back to log in</Link>
            </p>
          </form>
        )}

        {step === "done" && (
          <div className="auth__form">
            <div className="auth__head">
              <h1 className="cn-head auth__title">Password updated</h1>
              <p className="auth__subtitle">
                You can now log in with your new password.
              </p>
            </div>
            <button
              className="cn-btn cn-btn--primary auth__submit"
              onClick={() => navigate("/login")}
            >
              Go to log in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
