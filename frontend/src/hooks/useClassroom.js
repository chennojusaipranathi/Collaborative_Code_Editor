import { useCallback, useEffect, useState } from "react";
import * as classroomService from "../services/classroomService";

const POLL_MS = 3000; // previews refresh every 3 seconds

export default function useClassroom(roomId, socketRef, status) {
  const [data, setData] = useState(null); // { room, task, students }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load now, then every 3 seconds
  useEffect(() => {
    let active = true;
    const run = () =>
      classroomService
        .getClassroom(roomId)
        .then((result) => {
          if (!active) return;
          setData(result);
          setError("");
        })
        .catch((err) => active && setError(err.message))
        .finally(() => active && setLoading(false));

    run();
    const id = setInterval(run, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [roomId]);

  // Raised hands arrive instantly over the socket
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || status !== "connected") return;

    const onHands = (msg) => {
      if (msg.roomId !== roomId) return;
      const ids = new Set(msg.userIds);
      setData((d) =>
        d && { ...d, students: d.students.map((s) => ({ ...s, handRaised: ids.has(s.id) })) }
      );
    };
    socket.on("classroom:hands", onHands);
    return () => socket.off("classroom:hands", onHands);
  }, [socketRef, status, roomId]);

  const toggleLock = async () => {
    const locked = await classroomService.setLocked(roomId, !data.room.locked);
    setData((d) => ({ ...d, room: { ...d.room, locked } }));
  };
    // Updates the task on screen at once (the 3-second refresh would also catch it)
  const setTask = (task) => setData((d) => d && { ...d, task });

  const dismissHand = useCallback(
    (studentId) => socketRef.current?.emit("hand:dismiss", { roomId, userId: studentId }),
    [socketRef, roomId]
  );

  // A failed refresh after the first success should not replace the whole page with an error
  return { data, loading, error: data ? "" : error, toggleLock, dismissHand ,setTask};
}