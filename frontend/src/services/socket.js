import { io } from "socket.io-client";
import { loadSession } from "./authService";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Creates a new authenticated connection. The caller must call .disconnect() when done.
export function createSocket() {
  return io(SOCKET_URL, {
    auth: { token: loadSession()?.token },
    // reconnection is on by default; Socket.io retries with growing delays
  });
}