import { useCallback, useEffect, useState } from "react";

// A student's raise-hand state, kept in sync with the server
export default function useHand({ socketRef, status, roomId, userId, enabled }) {
  const [raised, setRaised] = useState(false);

  useEffect(() => {
    const socket = socketRef.current;
    if (!enabled || !socket || status !== "connected") return;

    const apply = (ids) => setRaised(ids.includes(userId));
    const onHands = (msg) => msg.roomId === roomId && apply(msg.userIds);

    socket.on("classroom:hands", onHands);
    socket.emit("hand:sync", { roomId }, (res) => res?.ok && apply(res.userIds));
    return () => socket.off("classroom:hands", onHands);
  }, [socketRef, status, roomId, userId, enabled]);

  const toggle = useCallback(() => {
    socketRef.current?.emit("hand:raise", { roomId, raised: !raised });
  }, [socketRef, roomId, raised]);

  return { raised, toggle };
}