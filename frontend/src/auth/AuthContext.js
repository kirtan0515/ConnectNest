// React auth context — replaces Amplify's <Authenticator.Provider> / useAuthenticator.
// Exposes the signed-in user plus auth actions to the whole app.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as auth from "./auth";
import { loginWithGoogle, loginWithMicrosoft, socialLoginEnabled } from "./oauth";
import { api } from "../api/client";

const AuthContext = createContext(null);

/**
 * If the just-signed-in account is deactivated or pending deletion, logging in
 * reactivates it (Instagram-style) and cancels any scheduled deletion within
 * the grace window. Best-effort: never block login on this.
 */
async function reactivateIfNeeded() {
  try {
    const prof = await api.get("/profiles/me");
    if (prof?.status === "deactivated" || prof?.status === "pending_deletion") {
      await api.post("/account/reactivate", {});
    }
  } catch {
    /* ignore — don't block sign-in */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { userId, email, name } | null
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const info = await auth.getUserInfo();
      setUser(info);
      return info;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const signIn = useCallback(
    async (credentials) => {
      await auth.signIn(credentials);
      await reactivateIfNeeded(); // logging in restores a deactivated/pending account
      return refresh();
    },
    [refresh]
  );

  const signOut = useCallback(() => {
    auth.signOut();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    refresh,
    signIn,
    signOut,
    signUp: auth.signUp,
    confirmSignUp: auth.confirmSignUp,
    resendCode: auth.resendCode,
    forgotPassword: auth.forgotPassword,
    confirmForgotPassword: auth.confirmForgotPassword,
    loginWithGoogle,
    loginWithMicrosoft,
    socialLoginEnabled: socialLoginEnabled(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Primary hook for components that need auth state/actions. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
