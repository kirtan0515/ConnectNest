// Central config sourced from build-time env vars (Vite inlines REACT_APP_*).
// Values come from the CDK stack outputs — see frontend/.env.example.

const config = {
  region: import.meta.env.REACT_APP_AWS_REGION || "us-east-1",
  userPoolId: import.meta.env.REACT_APP_USER_POOL_ID || "",
  userPoolClientId: import.meta.env.REACT_APP_USER_POOL_CLIENT_ID || "",
  // HTTP API base URL. In local dev this is the execute-api URL from .env.
  // In the CloudFront-served production build, no REACT_APP_API_URL is set, so
  // it defaults to the same-origin "/api" path (CloudFront routes /api/* to the
  // HTTP API) — which also removes CORS entirely.
  apiUrl: (import.meta.env.REACT_APP_API_URL || "/api").replace(/\/$/, ""),
  // WebSocket API base URL for live updates. No same-origin fallback (unlike
  // apiUrl): the socket cannot be proxied through CloudFront /api/*, so when
  // REACT_APP_WS_URL is unset this stays blank and live updates are disabled.
  wsUrl: (import.meta.env.REACT_APP_WS_URL || "").replace(/\/$/, ""),
  // Cognito Hosted UI domain for social (OAuth) sign-in, e.g.
  // "connectnest-auth.auth.us-east-1.amazoncognito.com"
  hostedUiDomain: (import.meta.env.REACT_APP_HOSTED_UI_DOMAIN || "").replace(/\/$/, ""),
  // Where Cognito redirects back after social login.
  oauthRedirectUri:
    import.meta.env.REACT_APP_OAUTH_REDIRECT_URI ||
    `${window.location.origin}/auth/callback`,
};

/** True when the Hosted UI (social login) is configured. */
export const socialLoginEnabled = () =>
  !!config.hostedUiDomain && !!config.userPoolClientId;

if (!config.userPoolId || !config.userPoolClientId) {
  // Surfaces misconfiguration early in dev instead of a cryptic Cognito error.
  // eslint-disable-next-line no-console
  console.warn(
    "[ConnectNest] Missing Cognito config. Set REACT_APP_USER_POOL_ID and " +
      "REACT_APP_USER_POOL_CLIENT_ID in frontend/.env (see .env.example)."
  );
}

export default config;
