import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import { api } from "../../../api/client";
import AuthNetworkCanvas from "../../../components/canvas/AuthNetworkCanvas";
import AuthNestAccent from "../../../components/auth/AuthNestAccent";
import SocialButtons from "../../../components/auth/SocialButtons";
import logo from "../../../assets/connectnest-logo.png";
import "./Signup.css";

const INTERESTS = [
  "Music", "Sports", "Tech", "Art",
  "Gaming", "Volunteering", "Film", "Outdoors",
];

/** Initials from a full name: first + last initial. */
function initialsOf(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function friendlyError(err) {
  const msg = (err && err.message) || "";
  const name = (err && err.name) || "";
  if (name === "UsernameExistsException" || /already exists/i.test(msg))
    return "An account with that email already exists. Try logging in.";
  if (name === "InvalidPasswordException")
    return "That password doesn't meet the requirements.";
  if (name === "CodeMismatchException" || /code/i.test(msg))
    return "That code doesn't match. Check the email and try again.";
  if (/network|failed to fetch/i.test(msg))
    return "Network trouble. Check your connection and try again.";
  return msg || "Something went wrong. Please try again.";
}

const Signup = () => {
  const { isAuthenticated, signUp, confirmSignUp, resendCode, signIn } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("form"); // form | verify | done
  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [picked, setPicked] = useState({});
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated && step !== "done") navigate("/dashboard");
  }, [isAuthenticated, step, navigate]);

  const rules = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One symbol", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const allMet = rules.every((r) => r.met);
  const firstName = name.trim().split(" ")[0] || "friend";

  const toggleChip = (label) =>
    setPicked((p) => {
      const next = { ...p };
      if (next[label]) delete next[label];
      else next[label] = true;
      return next;
    });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) {
      setError("Add your full name so classmates can find you.");
      return;
    }
    if (email.indexOf("@") < 1) {
      setError("Enter your university email, like you@university.edu.");
      return;
    }
    if (!allMet) {
      setError("Your password needs to meet all four rules above.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await signUp({ email: email.trim(), password, name: name.trim() });
      setStep("verify");
      setCode("");
      setResent(false);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (code.length !== 6) {
      setError("Enter all 6 digits from the email we sent.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await confirmSignUp({ email: email.trim(), code });
      // Sign in so we hold a JWT, then persist profile (major + interests).
      await signIn({ email: email.trim(), password });
      try {
        await api.put("/profiles/me", {
          name: name.trim(),
          major: major.trim(),
          interests: Object.keys(picked),
        });
      } catch {
        // Non-fatal: profile can be completed later from the Profile page.
      }
      setStep("done");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await resendCode({ email: email.trim() });
      setResent(true);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <div className="cn-scope auth">
      {/* Left visual pane */}
      <div className="auth__visual auth__visual--signup">
        <AuthNetworkCanvas youInitials={initialsOf(name)} />
        <Link to="/" className="auth__logo">
          <img src={logo} alt="ConnectNest" />
        </Link>
        <p className="auth__caption">
          Set up your profile once. Find your people all semester.
        </p>
      </div>

      {/* Right form pane */}
      <div className="auth__panel auth__panel--signup">
        <div className="auth__mobile">
          <Link to="/" className="auth__mobile-logo">
            <img src={logo} alt="ConnectNest" />
          </Link>
          <p className="cn-head auth__mobile-tagline">Join your campus community.</p>
          <AuthNestAccent />
        </div>

        {step === "form" && (
          <form className="auth__form" onSubmit={handleCreate} noValidate>
            <div className="auth__head">
              <h1 className="cn-head auth__title">Create your account</h1>
              <p className="auth__subtitle">
                Already have one? <Link to="/login">Log in</Link>
              </p>
            </div>

            <div className="signup__row2">
              <label className="cn-label" htmlFor="su-name">
                Full name
                <input
                  id="su-name"
                  className="cn-input"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                />
              </label>
              <label className="cn-label" htmlFor="su-major">
                Major
                <input
                  id="su-major"
                  className="cn-input"
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                />
              </label>
            </div>

            <label className="cn-label" htmlFor="su-email">
              University email
              <input
                id="su-email"
                className="cn-input"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
              />
            </label>

            <div className="cn-label">
              Password
              <div className="auth__pw-wrap">
                <input
                  id="su-password"
                  className="cn-input auth__pw-input"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  aria-describedby="su-rules"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                />
                <button
                  type="button"
                  className="auth__pw-toggle"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
              <ul id="su-rules" className="signup__rules">
                {rules.map((r) => (
                  <li key={r.label} className={`signup__rule${r.met ? " met" : ""}`}>
                    {r.met ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--accent)" strokeWidth="2" aria-hidden="true"><path d="M2.5 7.5l3 3 6-7" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#5f8783" strokeWidth="1.5" aria-hidden="true"><circle cx="7" cy="7" r="5" /></svg>
                    )}
                    <span>{r.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <fieldset className="signup__interests">
              <legend>Interests <span>(pick a few)</span></legend>
              <div className="signup__chips">
                {INTERESTS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className="cn-chip"
                    aria-pressed={picked[label] ? "true" : "false"}
                    onClick={() => toggleChip(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            {error && (
              <p className="cn-alert cn-alert--error" role="alert">{error}</p>
            )}

            <button type="submit" className="cn-btn cn-btn--primary auth__submit" disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </button>

            <SocialButtons label="or sign up with" />
          </form>
        )}

        {step === "verify" && (
          <form className="auth__form" onSubmit={handleVerify} noValidate>
            <div className="auth__head">
              <h1 className="cn-head auth__title">Check your email</h1>
              <p className="auth__subtitle">
                We sent a 6-digit code to {email}. Enter it below to verify your account.
              </p>
            </div>

            <label className="cn-label" htmlFor="su-code">
              Verification code
              <input
                id="su-code"
                className="cn-input signup__code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6));
                  setError("");
                }}
              />
            </label>

            {error && (
              <p className="cn-alert cn-alert--error" role="alert">{error}</p>
            )}
            {resent && (
              <p className="signup__resent" role="status">
                New code sent. It can take a minute to arrive.
              </p>
            )}

            <button type="submit" className="cn-btn cn-btn--primary auth__submit" disabled={busy}>
              {busy ? "Verifying…" : "Verify email"}
            </button>

            <div className="signup__verify-actions">
              <button type="button" className="signup__link" onClick={handleResend}>
                Resend code
              </button>
              <button
                type="button"
                className="signup__link signup__link--muted"
                onClick={() => { setStep("form"); setError(""); setResent(false); }}
              >
                Change email
              </button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="auth__form">
            <svg className="signup__check" width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="var(--accent)" strokeWidth="2" aria-hidden="true">
              <circle cx="28" cy="28" r="26" />
              <path d="M17 29l7 7 15-16" />
            </svg>
            <div className="auth__head">
              <h1 className="cn-head auth__title">You're in, {firstName}.</h1>
              <p className="auth__subtitle">
                Your email is verified and your profile is ready. Start by joining
                a group or checking what's on this week.
              </p>
            </div>
            <Link to="/dashboard" className="cn-btn cn-btn--primary auth__submit">
              Go to your dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;
