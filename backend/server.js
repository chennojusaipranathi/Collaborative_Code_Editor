import http from "http";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";
import { initSockets } from "./sockets/index.js";
import { flushAll } from "./sockets/docStore.js";

await connectDB();

const server = http.createServer(app);
initSockets(server);

server.listen(env.port, () => {
  console.log(`CodeSync backend running on http://localhost:${env.port}`);
});

// Save open documents when the server stops: Ctrl + C locally (SIGINT),
// or when Render redeploys or restarts it (SIGTERM)
async function shutDown() {
  await flushAll();
  process.exit(0);
}
process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);