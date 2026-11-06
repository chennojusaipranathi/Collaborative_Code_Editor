import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import Logo from "../common/Logo";
import ThemeToggle from "../common/ThemeToggle";
import useAuth from "../../hooks/useAuth";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-6">
      {/* The sidebar is hidden on small screens, so show the logo here instead */}
      <div className="md:hidden">
        <Logo />
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="text-right">
          <p className="text-sm font-medium text-ink">{user.name}</p>
          <p className="text-xs capitalize text-muted">{user.role}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-500 text-sm font-semibold uppercase text-white">
          {user.name.charAt(0)}
        </span>
        <button
          onClick={handleLogout}
          aria-label="Log out"
          className="rounded-lg border border-line p-2 text-muted transition-colors hover:text-ink"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}