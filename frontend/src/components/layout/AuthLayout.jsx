import Logo from "../common/Logo";
import ThemeToggle from "../common/ThemeToggle";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-app">
      <div className="flex items-center justify-between px-6 py-4">
        <Logo />
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8">
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}