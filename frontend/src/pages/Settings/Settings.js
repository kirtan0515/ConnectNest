import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  deactivateAccount,
  deleteAccount,
} from "../../services/accountServices";
import "./Settings.css";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");

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
