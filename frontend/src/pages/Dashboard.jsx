import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Button from "../components/common/Button";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-app">
      <h1 className="text-2xl font-bold text-ink">Hello, {user.name}</h1>
      <p className="text-muted">Role: {user.role}. The real dashboard comes next.</p>
      <Button variant="secondary" onClick={handleLogout}>Log out</Button>
    </div>
  );
}