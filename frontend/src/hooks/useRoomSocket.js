import { useEffect, useRef, useState } from "react";
import { createSocket } from "../services/socket";

// Connects to the room, tracks who is online and the connection status
export default function useRoomSocket(roomId) {
  const socketRef = useRef(null);
  const [online, setOnline] = useState([]); // [{ id, name }]
  const [status, setStatus] = useState("connecting"); // connecting | connected | disconnected | error

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    const join = () => {
      socket.emit("room:join", roomId, (res) => {
        if (res?.ok) {
          setOnline(res.online);
          setStatus("connected");
        } else {
          setStatus("error");
        }
      });
    };

    // "connect" fires on the first connection AND after every reconnect,
    // so we re-join the room each time (the server forgot us when we dropped)
    socket.on("connect", join);
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("error"));
    socket.on("presence:update", setOnline);

    // Cleanup: leave the room and close the connection
    return () => {
      socket.emit("room:leave", roomId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  return { socketRef, online, status };
}