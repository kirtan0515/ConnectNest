import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { handleOAuthCallback } from "../../../auth/oauth";
import { useAuth } from "../../../auth/AuthContext";
import { api } from "../../../api/client";
import logo from "../../../assets/connectnest-logo.png";
import "../Login/Login.css";

/**
 * Handles the Cognito Hosted UI redirect: exchanges the ?code for tokens,
 * refreshes auth state, and sends the user to the dashboard.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await handleOAuthCallback();
        await refresh();
        // Decide where to send the user based on their profile.
        let dest = "/dashboard";
        try {
          const prof = await api.get("/profiles/me");
          // Logging in reactivates a deactivated / pending-deletion account.
          if (
            prof?.status === "deactivated" ||
            prof?.status === "pending_deletion"
          ) {
            await api.post("/account/reactivate", {});
          }
          // New social users have no profile yet -> onboarding (major + interests).
          if (!prof?.exists) dest = "/onboarding";
        } catch {
          dest = "/onboarding";
        }
        if (!cancelled) navigate(dest, { replace: true });
      } catch (err) {
        if (!cancelled) setError(err.message || "Sign-in failed.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, refresh]);

  return (
    <div className="cn-scope auth">
      <div className="auth__panel auth__panel--login" style={{ margin: "0 auto" }}>
        <div className="auth__form">
          <Link to="/" className="auth__logo" style={{ marginBottom: 8 }}>
            <img src={logo} alt="ConnectNest" />
          </Link>
          {error ? (
            <>
              <h1 className="cn-head auth__title">Sign-in didn't finish</h1>
              <p className="cn-alert cn-alert--error" role="alert">{error}</p>
              <Link to="/login" className="cn-btn cn-btn--primary auth__submit">
                Back to log in
              </Link>
            </>
          ) : (
            <>
              <h1 className="cn-head auth__title">Signing you in…</h1>
              <p className="auth__subtitle">Finishing up with your provider.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
