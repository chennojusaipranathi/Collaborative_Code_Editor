import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

// Logged-out visitors go to /login, and we remember where they wanted to go
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}