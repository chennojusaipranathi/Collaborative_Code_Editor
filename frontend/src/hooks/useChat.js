import { useCallback, useEffect, useState } from "react";
import { getMessages } from "../services/chatService";

// Loads history, listens for new messages, and sends
export default function useChat({ socketRef, status, roomId, panelOpen }) {
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);

  // History, once per room
  useEffect(() => {
    let active = true;
    getMessages(roomId)
      .then((list) => active && setMessages(list))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [roomId]);

  // Live messages. Re-attached after reconnects because `status` changes.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || status !== "connected") return;

    const onMessage = (msg) => {
      if (msg.roomId !== roomId) return;
      // Ignore duplicates (e.g. a message that also arrived in the history load)
      setMessages((list) =>
        list.some((m) => m.id === msg.message.id) ? list : [...list, msg.message]
      );
      if (!panelOpen) setUnread((n) => n + 1);
    };

    socket.on("chat:message", onMessage);
    return () => socket.off("chat:message", onMessage);
  }, [socketRef, status, roomId, panelOpen]);

  const send = useCallback(
    (text) =>
      new Promise((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected) return resolve("You are offline");
        socket.emit("chat:send", { roomId, text }, (res) =>
          resolve(res?.ok ? null : res?.message || "Could not send")
        );
      }),
    [socketRef, roomId]
  );

  const clearUnread = useCallback(() => setUnread(0), []);

  return { messages, unread, send, clearUnread };
}