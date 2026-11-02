import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import AuthNetworkCanvas from "../../../components/canvas/AuthNetworkCanvas";
import AuthNestAccent from "../../../components/auth/AuthNestAccent";
import SocialButtons from "../../../components/auth/SocialButtons";
import logo from "../../../assets/connectnest-logo.png";
import "./Login.css";

/** Map Cognito/technical errors to plain, friendly language. */
function friendlyError(err) {
  const msg = (err && err.message) || "";
  const name = (err && err.name) || "";
  if (name === "NotAuthorizedException" || /incorrect/i.test(msg))
    return "That email or password doesn't match. Try again.";
  if (name === "UserNotConfirmedException")
    return "Please verify your email first — check for the code we sent.";
  if (name === "UserNotFoundException")
    return "We couldn't find an account with that email.";
  if (name === "CodeMismatchException" || name === "EnableSoftwareTokenMFAException")
    return "That code didn't work. Check your authenticator app and try again.";
  if (name === "ExpiredCodeException")
    return "That code expired. Log in again to get a fresh one.";
  if (/network|failed to fetch/i.test(msg))
    return "Network trouble. Check your connection and try again.";
  return msg || "Something went wrong. Please try again.";
}

const Login = () => {
  const { isAuthenticated, signIn, completeMfaSignIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaUser, setMfaUser] = useState(null); // set when a 6-digit code is needed
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (mfaUser) {
      if (!/^\d{6}$/.test(mfaCode.trim())) {
        setError("Enter the 6-digit code from your authenticator app.");
        return;
      }
      setError("");
      setBusy(true);
      try {
        await completeMfaSignIn(mfaUser, mfaCode);
        navigate("/dashboard");
      } catch (err) {
        setError(friendlyError(err));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!email.trim() || !password) {
      setError("Enter your university email and password to log in.");
      return;
    }
    if (email.indexOf("@") < 1) {
      setError("That email address is missing an @. Check it and try again.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const result = await signIn({ email: email.trim(), password });
      if (result && result.mfaRequired) {
        setMfaUser(result.mfaUser);
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cn-scope auth">
      {/* Left visual pane */}
      <div className="auth__visual auth__visual--login">
        <AuthNetworkCanvas />
        <Link to="/" className="auth__logo">
          <img src={logo} alt="ConnectNest" />
        </Link>
        <p className="auth__caption">
          Your groups, events and messages are waiting.
        </p>
      </div>

      {/* Right form pane */}
      <div className="auth__panel auth__panel--login">
        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="auth__mobile">
            <Link to="/" className="auth__mobile-logo">
              <img src={logo} alt="ConnectNest" />
            </Link>
            <p className="cn-head auth__mobile-tagline">Your campus, connected.</p>
            <AuthNestAccent />
          </div>

          <div className="auth__head">
            <h1 className="cn-head auth__title">{mfaUser ? "Check your authenticator" : "Log in"}</h1>
            <p className="auth__subtitle">
              {mfaUser
                ? "Enter the 6-digit code from your authenticator app."
                : "Use the university email you signed up with."}
            </p>
          </div>

          {mfaUser ? (
            <div className="auth__fields">
              <label className="cn-label" htmlFor="login-mfa">
                Authentication code
                <input
                  id="login-mfa"
                  className="cn-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  autoFocus
                  value={mfaCode}
                  onChange={(e) => {
                    setMfaCode(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                />
              </label>
            </div>
          ) : (
          <div className="auth__fields">
            <label className="cn-label" htmlFor="login-email">
              University email
              <input
                id="login-email"
                className="cn-input"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
              />
            </label>

            <label className="cn-label" htmlFor="login-password">
              <span className="auth__pw-row">
                Password
                <Link to="/forgot-password" className="auth__forgot">Forgot password?</Link>
              </span>
              <span className="auth__pw-wrap">
                <input
                  id="login-password"
                  className="cn-input auth__pw-input"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
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
          </div>
          )}
          {error && (
            <p className="cn-alert cn-alert--error" role="alert">{error}</p>
          )}

          <button
            type="submit"
            className="cn-btn cn-btn--primary auth__submit"
            disabled={busy}
          >
            {busy ? (mfaUser ? "Verifying…" : "Logging in…") : mfaUser ? "Verify" : "Log in"}
          </button>

          {!mfaUser && <SocialButtons />}

          <p className="auth__switch">
            New to ConnectNest? <Link to="/signup">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
