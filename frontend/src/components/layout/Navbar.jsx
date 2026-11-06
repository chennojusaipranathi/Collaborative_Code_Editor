import Logo from "../common/Logo";
import Button from "../common/Button";
import ThemeToggle from "../common/ThemeToggle";
import useAuth from "../../hooks/useAuth";

export default function Navbar() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-app/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button to="/dashboard">Go to dashboard</Button>
          ) : (
            <>
              <Button to="/login" variant="ghost">Log in</Button>
              <Button to="/register">Get started</Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}