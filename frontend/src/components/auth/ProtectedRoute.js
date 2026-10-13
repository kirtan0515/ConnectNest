import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import LoadingSpinner from "../layout/LoadingSpinner";

/**
 * Gate for authenticated routes. Waits for the initial session check, then
 * redirects to /login if there's no signed-in user.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
