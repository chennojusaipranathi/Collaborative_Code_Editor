import { NavLink } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import Logo from "../common/Logo";
import ServerStatus from "../common/ServerStatus";

// Only pages that exist are listed. We add links as we build new pages.
const links = [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];

export default function Sidebar() {
  return (
    <aside className="hidden w-60 flex-col border-r border-line bg-surface md:flex">
      <div className="flex h-16 items-center border-b border-line px-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-indigo-500/15 text-indigo-400" : "text-muted hover:text-ink"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line p-4">
        <ServerStatus />
      </div>
    </aside>
  );
}