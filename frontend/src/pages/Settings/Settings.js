import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  deactivateAccount,
  deleteAccount,
} from "../../services/accountServices";
import {
  getMfaEnabled,
  startMfaEnrollment,
  confirmMfaEnrollment,
  disableMfa,
} from "../../auth/auth";
import "./Settings.css";

/** Friendly text for the few errors the MFA calls can return. */
function mfaError(err) {
  const name = (err && err.name) || "";
  if (name === "CodeMismatchException" || name === "EnableSoftwareTokenMFAException")
    return "That code didn't match. Check your authenticator app and try again.";
  return (err && err.message) || "Something went wrong. Try again.";
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");

  // ---- Two-step verification (authenticator app) ----
  const [mfaOn, setMfaOn] = useState(null); // null = loading
  const [mfaStep, setMfaStep] = useState("idle"); // idle | enrolling
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaQr, setMfaQr] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError_, setMfaError] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);

  useEffect(() => {
    if (user?.federated) return;
    getMfaEnabled().then(setMfaOn).catch(() => setMfaOn(false));
  }, [user]);

  const beginMfa = async () => {
    setMfaBusy(true);
    setMfaError("");
    try {
      const secret = await startMfaEnrollment();
      const label = `ConnectNest:${encodeURIComponent(user?.email || "account")}`;
      const uri = `otpauth://totp/${label}?secret=${secret}&issuer=ConnectNest`;
      setMfaQr(await QRCode.toDataURL(uri, { width: 200, margin: 1 }));
      setMfaSecret(secret);
      setMfaStep("enrolling");
    } catch (err) {
      setMfaError(mfaError(err));
    } finally {
      setMfaBusy(false);
    }
  };

  const finishMfa = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(mfaCode.trim())) {
      setMfaError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setMfaBusy(true);
    setMfaError("");
    try {
      await confirmMfaEnrollment(mfaCode);
      setMfaOn(true);
      cancelMfa();
    } catch (err) {
      setMfaError(mfaError(err));
    } finally {
      setMfaBusy(false);
    }
  };

  const cancelMfa = () => {
    setMfaStep("idle");
    setMfaSecret("");
    setMfaQr("");
    setMfaCode("");
  };

  const turnOffMfa = async () => {
    if (!window.confirm("Turn off two-step verification? Your account will be protected by your password only.")) return;
    setMfaBusy(true);
    setMfaError("");
    try {
      await disableMfa();
      setMfaOn(false);
    } catch (err) {
      setMfaError(mfaError(err));
    } finally {
      setMfaBusy(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Deactivate your account? You can reactivate anytime by logging back in.")) return;
    setBusy("deactivate");
    setError("");
    try {
      await deactivateAccount();
      signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Could not deactivate. Try again.");
      setBusy("");
    }
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setError('Type DELETE (in capitals) to confirm.');
      return;
    }
    setBusy("delete");
    setError("");
    try {
      await deleteAccount();
      signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Could not delete. Try again.");
      setBusy("");
    }
  };

  return (
    <div className="settings">
      <h1 className="settings__title">Account settings</h1>
      <p className="settings__sub">
        Signed in as {user?.email || user?.name || "your account"}.
      </p>

      {error && <div className="settings__error" role="alert">{error}</div>}

      {/* Two-step verification */}
      <section className="settings__card">
        <h2>Two-step verification</h2>
        {user?.federated ? (
          <p>
            You sign in with Google or Microsoft, so two-step verification is
            managed in that account's security settings.
          </p>
        ) : mfaOn === null ? (
          <p>Checking your settings…</p>
        ) : mfaStep === "enrolling" ? (
          <form className="settings__mfa" onSubmit={finishMfa} noValidate>
            <p>
              1. Scan this code with an authenticator app such as Google
              Authenticator, Microsoft Authenticator or 1Password.
            </p>
            {mfaQr && (
              <img
                className="settings__qr"
                src={mfaQr}
                alt="QR code for your authenticator app"
                width="200"
                height="200"
              />
            )}
            <p className="settings__hint">
              Can't scan? Enter this key manually:{" "}
              <code className="settings__secret">{mfaSecret}</code>
            </p>
            <label className="settings__confirm">
              2. Enter the 6-digit code it shows
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={mfaCode}
                onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, "")); setMfaError(""); }}
              />
            </label>
            <div className="settings__row">
              <button type="submit" className="settings__btn settings__btn--primary" disabled={mfaBusy}>
                {mfaBusy ? "Verifying…" : "Turn on"}
              </button>
              <button type="button" className="settings__btn settings__btn--ghost" onClick={cancelMfa} disabled={mfaBusy}>
                Cancel
              </button>
            </div>
          </form>
        ) : mfaOn ? (
          <>
            <p>
              <strong>On.</strong> You'll be asked for a code from your
              authenticator app each time you log in.
            </p>
            <button className="settings__btn settings__btn--warn" onClick={turnOffMfa} disabled={mfaBusy}>
              {mfaBusy ? "Turning off…" : "Turn off"}
            </button>
          </>
        ) : (
          <>
            <p>
              Add a second layer of protection. After your password, you'll
              enter a 6-digit code from an authenticator app on your phone.
            </p>
            <button className="settings__btn settings__btn--primary" onClick={beginMfa} disabled={mfaBusy}>
              {mfaBusy ? "Setting up…" : "Set up two-step verification"}
            </button>
          </>
        )}
        {mfaError_ && <div className="settings__error" role="alert">{mfaError_}</div>}
      </section>

      {/* Deactivate */}
      <section className="settings__card">
        <h2>Deactivate account</h2>
        <p>
          Temporarily hide your profile, posts and activity. Your data is kept,
          and you can reactivate anytime just by logging back in.
        </p>
        <button
          className="settings__btn settings__btn--warn"
          onClick={handleDeactivate}
          disabled={!!busy}
        >
          {busy === "deactivate" ? "Deactivating…" : "Deactivate my account"}
        </button>
      </section>

      {/* Delete */}
      <section className="settings__card settings__card--danger">
        <h2>Delete account</h2>
        <p>
          Permanently delete your account and all your data (profile, posts,
          comments, events, RSVPs, group memberships). You'll have{" "}
          <strong>30 days to change your mind</strong> by logging back in and
          reactivating — after that it's gone for good.
        </p>
        <label className="settings__confirm">
          Type <strong>DELETE</strong> to confirm
          <input
            type="text"
            value={confirmText}
            onChange={(e) => { setConfirmText(e.target.value); setError(""); }}
            placeholder="DELETE"
          />
        </label>
        <button
          className="settings__btn settings__btn--danger"
          onClick={handleDelete}
          disabled={!!busy || confirmText !== "DELETE"}
        >
          {busy === "delete" ? "Deleting…" : "Delete my account"}
        </button>
      </section>
    </div>
  );
};

export default Settings;
