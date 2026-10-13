// Backwards-compatible alias. The app now uses ProtectedRoute (Cognito-based).
import ProtectedRoute from "./ProtectedRoute";

const AuthenticatorWrapper = ProtectedRoute;

export default AuthenticatorWrapper;
