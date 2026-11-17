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

// Save open documents when the server is stopped (Ctrl + C)
process.on("SIGINT", async () => {
  await flushAll();
  process.exit(0);
});