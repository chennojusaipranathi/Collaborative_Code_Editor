import { useEffect, useState } from "react";
import { getHealth } from "./services/api";

function App() {
  // status can be: "loading", "connected" or "offline"
  const [status, setStatus] = useState("loading");
  const [info, setInfo] = useState(null);

  useEffect(() => {
    getHealth()
      .then((data) => {
        setInfo(data);
        setStatus("connected");
      })
      .catch(() => {
        setStatus("offline");
      });
  }, []);

  const statusStyles = {
    loading: "text-yellow-400",
    connected: "text-green-400",
    offline: "text-red-400",
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-violet-400">CodeSync</h1>

      <div className="bg-slate-800 rounded-xl p-6 w-80 border border-slate-700">
        <p className="text-slate-400 text-sm mb-1">Backend status</p>
        <p className={`text-xl font-semibold ${statusStyles[status]}`}>
          {status === "loading" && "Checking..."}
          {status === "connected" && "Connected"}
          {status === "offline" && "Offline"}
        </p>

        {info && (
          <p className="text-slate-500 text-xs mt-3">
            {info.service} at {new Date(info.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;