import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

// Wraps every logged-in page: sidebar on the left, top bar on top, page content in the middle
export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}