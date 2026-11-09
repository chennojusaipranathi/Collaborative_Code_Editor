import { useCallback, useEffect, useRef, useState } from "react";
import { getMessages } from "../services/chatService";

const TYPING_TTL_MS = 3000; // hide "typing" this long after the last signal
const TYPING_SEND_GAP_MS = 2000; // send our own signal at most this often

export default function useChat({ socketRef, status, roomId, panelOpen }) {
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [typing, setTyping] = useState({}); // userId -> name

  const timers = useRef({}); // userId -> expiry timer
  const lastTypingSent = useRef(0);

  const stopTyping = useCallback((userId) => {
    clearTimeout(timers.current[userId]);
    delete timers.current[userId];
    setTyping((t) => {
      if (!(userId in t)) return t;
      const next = { ...t };
      delete next[userId];
      return next;
    });
  }, []);

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

  // Live messages and typing signals
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || status !== "connected") return;

    const onMessage = (msg) => {
      if (msg.roomId !== roomId) return;
      setMessages((list) =>
        list.some((m) => m.id === msg.message.id) ? list : [...list, msg.message]
      );
      stopTyping(msg.message.senderId); // they sent it, so they stopped typing
      if (!panelOpen) setUnread((n) => n + 1);
    };

    const onTyping = ({ roomId: r, userId, name }) => {
      if (r !== roomId) return;
      setTyping((t) => ({ ...t, [userId]: name }));
      clearTimeout(timers.current[userId]);
      timers.current[userId] = setTimeout(() => stopTyping(userId), TYPING_TTL_MS);
    };

    socket.on("chat:message", onMessage);
    socket.on("chat:typing", onTyping);
    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:typing", onTyping);
    };
  }, [socketRef, status, roomId, panelOpen, stopTyping]);

  // Clear all pending timers when leaving the room
  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

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

  // Called on every keystroke; throttled so we don't flood the socket
  const notifyTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    const now = Date.now();
    if (now - lastTypingSent.current < TYPING_SEND_GAP_MS) return;
    lastTypingSent.current = now;
    socket.emit("chat:typing", { roomId });
  }, [socketRef, roomId]);

  const clearUnread = useCallback(() => setUnread(0), []);

  return { messages, unread, typing, send, notifyTyping, clearUnread };
}