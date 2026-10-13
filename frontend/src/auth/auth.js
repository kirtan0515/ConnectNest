// Cognito auth wrapper — the single place the app talks to amazon-cognito-identity-js.
// Keeping the library isolated here means components never import it directly,
// so it stays swappable.

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import config from "../config";

// Build the pool lazily so the app still renders when Cognito config is absent
// (e.g. before the backend is deployed and .env is filled in). CognitoUserPool
// throws on empty UserPoolId/ClientId, which would otherwise white-screen the app.
let _userPool = null;
function getUserPool() {
  if (_userPool) return _userPool;
  if (!config.userPoolId || !config.userPoolClientId) {
    throw new Error(
      "Cognito is not configured. Set REACT_APP_USER_POOL_ID and " +
        "REACT_APP_USER_POOL_CLIENT_ID in frontend/.env."
    );
  }
  _userPool = new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.userPoolClientId,
  });
  return _userPool;
}

/** Sign up a new user. attributes: { email, name }. */
export function signUp({ email, password, name }) {
  return new Promise((resolve, reject) => {
    const attributes = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
    ];
    if (name) {
      attributes.push(new CognitoUserAttribute({ Name: "name", Value: name }));
    }
    getUserPool().signUp(email, password, attributes, [], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/** Confirm sign-up with the emailed verification code. */
export function confirmSignUp({ email, code }) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getUserPool() });
    user.confirmRegistration(code, true, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/** Resend the sign-up confirmation code. */
export function resendCode({ email }) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getUserPool() });
    user.resendConfirmationCode((err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/** Start a password reset — emails a verification code. */
export function forgotPassword({ email }) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getUserPool() });
    user.forgotPassword({
      onSuccess: (data) => resolve(data),
      onFailure: (err) => reject(err),
      // inputVerificationCode fires on success too; onSuccess covers it.
    });
  });
}

/** Complete a password reset with the emailed code + new password. */
export function confirmForgotPassword({ email, code, newPassword }) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getUserPool() });
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(true),
      onFailure: (err) => reject(err),
    });
  });
}

/** Sign in; resolves with the CognitoUserSession. */
export function signIn({ email, password }) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getUserPool() });
    const details = new AuthenticationDetails({
      Username: email,
      Password: password,
    });
    user.authenticateUser(details, {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(err),
      // If the pool ever requires a new password, surface a clear error.
      newPasswordRequired: () =>
        reject(new Error("A new password is required for this account.")),
    });
  });
}

/** True when Cognito config is present. */
export function isConfigured() {
  return !!config.userPoolId && !!config.userPoolClientId;
}

/** Sign out the current user (clears local tokens). No-op if unconfigured. */
export function signOut() {
  if (!isConfigured()) return;
  const user = getUserPool().getCurrentUser();
  if (user) user.signOut();
}

/** The currently cached user, or null (null if unconfigured). */
export function getCurrentUser() {
  if (!isConfigured()) return null;
  return getUserPool().getCurrentUser();
}

/**
 * Resolve the current valid session, refreshing tokens if needed.
 * Rejects if there is no signed-in user or the session is invalid.
 */
export function getSession() {
  return new Promise((resolve, reject) => {
    if (!isConfigured()) return reject(new Error("Cognito not configured"));
    const user = getUserPool().getCurrentUser();
    if (!user) return reject(new Error("No current user"));
    user.getSession((err, session) => {
      if (err) return reject(err);
      if (!session || !session.isValid()) {
        return reject(new Error("Invalid session"));
      }
      resolve(session);
    });
  });
}

/** The raw JWT id token string, for the Authorization header. */
export async function getIdToken() {
  const session = await getSession();
  return session.getIdToken().getJwtToken();
}

/**
 * A normalized view of the signed-in user for the UI:
 * { userId, email, name }, or null if not signed in.
 */
export async function getUserInfo() {
  const session = await getSession();
  const idToken = session.getIdToken();
  const payload = idToken.decodePayload();
  return {
    userId: payload.sub,
    email: payload.email || "",
    name: payload.name || payload.email || "",
  };
}
