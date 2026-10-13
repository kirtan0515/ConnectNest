// Social / federated sign-in via Cognito Hosted UI (OAuth2 authorization-code
// flow with PKCE). This complements the email/password path in auth.js:
// password login uses amazon-cognito-identity-js directly; social login
// redirects to the Hosted UI, then this module exchanges the returned code for
// tokens and stores them in the exact localStorage keys that
// amazon-cognito-identity-js reads — so getSession()/getCurrentUser() keep
// working for the rest of the app with no special-casing.

import config, { socialLoginEnabled } from "../config";

const STORAGE_PREFIX = "CognitoIdentityServiceProvider";
const PKCE_KEY = "connectnest.pkce_verifier";

export { socialLoginEnabled };

// ---- PKCE helpers ----
function randomString(len = 48) {
  const arr = new Uint8Array(len);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, (b) => ("0" + (b & 0xff).toString(16)).slice(-2)).join("");
}

function base64UrlEncode(bytes) {
  let str = "";
  const b = new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) str += String.fromCharCode(b[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(input) {
  const data = new TextEncoder().encode(input);
  return window.crypto.subtle.digest("SHA-256", data);
}

/** Redirect the browser to the Hosted UI for a given provider. */
export async function loginWithProvider(provider) {
  if (!socialLoginEnabled()) {
    throw new Error("Social login is not configured.");
  }
  const verifier = randomString(48);
  sessionStorage.setItem(PKCE_KEY, verifier);
  const challenge = base64UrlEncode(await sha256(verifier));

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.userPoolClientId,
    redirect_uri: config.oauthRedirectUri,
    scope: "openid email profile",
    identity_provider: provider, // "Google" | "Microsoft"
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  window.location.assign(
    `https://${config.hostedUiDomain}/oauth2/authorize?${params.toString()}`
  );
}

export const loginWithGoogle = () => loginWithProvider("Google");
export const loginWithMicrosoft = () => loginWithProvider("Microsoft");

/** Decode a JWT payload (no verification — just to read claims client-side). */
function decodeJwt(token) {
  const part = token.split(".")[1];
  const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decodeURIComponent(escape(json)));
}

/**
 * Handle the /auth/callback redirect: exchange the code for tokens and store
 * them so amazon-cognito-identity-js can read the session.
 * Returns { userId, email, name }.
 */
export async function handleOAuthCallback() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error) throw new Error(url.searchParams.get("error_description") || error);
  if (!code) throw new Error("Missing authorization code.");

  const verifier = sessionStorage.getItem(PKCE_KEY);
  sessionStorage.removeItem(PKCE_KEY);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.userPoolClientId,
    code,
    redirect_uri: config.oauthRedirectUri,
    ...(verifier ? { code_verifier: verifier } : {}),
  });

  const res = await fetch(`https://${config.hostedUiDomain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text || res.status}`);
  }
  const tokens = await res.json(); // { id_token, access_token, refresh_token, expires_in }

  const idClaims = decodeJwt(tokens.id_token);
  const username = idClaims["cognito:username"] || idClaims.sub;

  // Write tokens into the keys amazon-cognito-identity-js expects.
  const base = `${STORAGE_PREFIX}.${config.userPoolClientId}`;
  localStorage.setItem(`${base}.LastAuthUser`, username);
  const u = `${base}.${username}`;
  localStorage.setItem(`${u}.idToken`, tokens.id_token);
  localStorage.setItem(`${u}.accessToken`, tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem(`${u}.refreshToken`, tokens.refresh_token);
  }
  localStorage.setItem(
    `${u}.clockDrift`,
    "0"
  );

  return {
    userId: idClaims.sub,
    email: idClaims.email || "",
    name: idClaims.name || idClaims.email || "",
  };
}
