import Button from "../components/common/Button";
import useAuth from "../hooks/useAuth";

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-app">
      <p className="text-7xl font-bold text-indigo-400">404</p>
      <p className="text-muted">This page doesn't exist.</p>
      <Button to={isAuthenticated ? "/dashboard" : "/"}>
        {isAuthenticated ? "Back to dashboard" : "Back to home"}
      </Button>
    </div>
  );
}