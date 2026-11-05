import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

// Wrap a page in this: logged-out visitors get sent to /login
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}