import { useEffect, useRef, useState } from "react";
import { createSocket } from "../services/socket";

// status: connecting | connected | reconnecting | error
export default function useRoomSocket(roomId) {
  const socketRef = useRef(null);
  const [online, setOnline] = useState([]);
  const [status, setStatus] = useState("connecting");

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

    // Fires on the first connection AND after every reconnect
    socket.on("connect", join);
    socket.on("disconnect", (reason) => {
      // "io server disconnect" means the server closed us: Socket.io will NOT retry by itself
      if (reason === "io server disconnect") socket.connect();
      setStatus("reconnecting");
    });
    socket.on("connect_error", () => {
      // socket.active is true while Socket.io is still going to retry
      setStatus(socket.active ? "reconnecting" : "error");
    });
    socket.on("presence:update", setOnline);

    return () => {
      socket.emit("room:leave", roomId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  return { socketRef, online, status };
}