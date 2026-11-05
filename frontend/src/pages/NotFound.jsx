import Button from "../components/common/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-app">
      <p className="text-7xl font-bold text-indigo-400">404</p>
      <p className="text-muted">This page doesn't exist.</p>
      <Button to="/">Back to home</Button>
    </div>
  );
}