import { useAuthenticator } from "@aws-amplify/ui-react";

const ADMIN_EMAIL = "your-admin@email.com"; // replace with your email

/**
 * Returns { isAdmin, isUser }
 * Admin check: Cognito group "Admins" OR matching email fallback.
 */
export function useRole() {
  const { user } = useAuthenticator();
  const attrs = user?.attributes || {};

  // Cognito tokens include cognito:groups in the JWT payload
  const groups = user?.signInDetails?.loginId
    ? []
    : (user?.tokens?.idToken?.payload?.["cognito:groups"] || []);

  const isAdmin =
    groups.includes("Admins") ||
    attrs.email === ADMIN_EMAIL;

  return { isAdmin, isUser: !isAdmin };
}
