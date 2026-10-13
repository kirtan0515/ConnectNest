import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import { api } from "../../../api/client";
import AuthNetworkCanvas from "../../../components/canvas/AuthNetworkCanvas";
import logo from "../../../assets/connectnest-logo.png";
import "../Signup/Signup.css";

const INTERESTS = [
  "Music", "Sports", "Tech", "Art",
  "Gaming", "Volunteering", "Film", "Outdoors",
];

function initialsOf(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Profile onboarding for social (Google/Microsoft) sign-ins. Their email + name
 * already come from the provider via Cognito; this collects the same extra
 * fields the email/password sign-up form asks for (major + interests) and
 * saves the profile. Shown once, right after the first social login.
 */
const Onboarding = () => {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [picked, setPicked] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  // Prefill name from the provider; skip onboarding if a profile already exists.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user?.name) setName(user.name);
      try {
        const prof = await api.get("/profiles/me");
        if (!cancelled && prof?.exists) {
          navigate("/dashboard", { replace: true });
          return;
        }
        if (!cancelled && prof?.name && !user?.name) setName(prof.name);
      } catch {
        /* ignore — treat as new */
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const toggleChip = (label) =>
    setPicked((p) => {
      const next = { ...p };
      if (next[label]) delete next[label];
      else next[label] = true;
      return next;
    });

  const handleSave = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) {
      setError("Add your name so classmates can find you.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await api.put("/profiles/me", {
        name: name.trim(),
        major: major.trim(),
        interests: Object.keys(picked),
      });
      await refresh();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Could not save your profile. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const firstName = (user?.name || name).trim().split(" ")[0] || "there";

  return (
    <div className="cn-scope auth">
      <div className="auth__visual auth__visual--signup">
        <AuthNetworkCanvas youInitials={initialsOf(name)} />
        <a href="/" className="auth__logo">
          <img src={logo} alt="ConnectNest" />
        </a>
        <p className="auth__caption">
          Set up your profile once. Find your people all semester.
        </p>
      </div>

      <div className="auth__panel auth__panel--signup">
        {checking ? (
          <div className="auth__form">
            <h1 className="cn-head auth__title">One moment…</h1>
            <p className="auth__subtitle">Checking your profile.</p>
          </div>
        ) : (
          <form className="auth__form" onSubmit={handleSave} noValidate>
            <div className="auth__head">
              <h1 className="cn-head auth__title">Welcome, {firstName}!</h1>
              <p className="auth__subtitle">
                You're signed in with {user?.email || "your account"}. Tell us a
                little about you to finish setting up.
              </p>
            </div>

            <label className="cn-label" htmlFor="ob-name">
              Full name
              <input
                id="ob-name"
                className="cn-input"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
              />
            </label>

            <label className="cn-label" htmlFor="ob-major">
              Major
              <input
                id="ob-major"
                className="cn-input"
                type="text"
                placeholder="e.g. Computer Science"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
              />
            </label>

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

            {error && <p className="cn-alert cn-alert--error" role="alert">{error}</p>}

            <button type="submit" className="cn-btn cn-btn--primary auth__submit" disabled={busy}>
              {busy ? "Saving…" : "Finish & go to dashboard"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
