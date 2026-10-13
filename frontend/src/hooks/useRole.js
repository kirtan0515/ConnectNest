import { useAuth } from "../auth/AuthContext";

const ADMIN_EMAIL = "your-admin@email.com"; // replace with your admin email

/**
 * Returns { isAdmin, isUser }.
 * Admin check by email for now; swap to a Cognito group check later.
 */
export function useRole() {
  const { user } = useAuth();
  const isAdmin = !!user && user.email === ADMIN_EMAIL;
  return { isAdmin, isUser: !isAdmin };
}
