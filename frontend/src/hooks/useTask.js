import { useCallback, useEffect, useState } from "react";
import { getTask, submitTask } from "../services/taskService";

// The assigned task and my submission status, kept in sync with the teacher's changes
export default function useTask({ socketRef, status, roomId, enabled }) {
  const [state, setState] = useState({ task: null, submission: null });

  const load = useCallback(
    () => getTask(roomId).then(setState).catch(() => {}),
    [roomId]
  );

  // Load on open, and again after every reconnect
  useEffect(() => {
    if (enabled) load();
  }, [enabled, status, load]);

  // The teacher changed or removed the task
  useEffect(() => {
    const socket = socketRef.current;
    if (!enabled || !socket || status !== "connected") return;

    const onChanged = (msg) => msg.roomId === roomId && load();
    socket.on("task:changed", onChanged);
    return () => socket.off("task:changed", onChanged);
  }, [socketRef, status, roomId, enabled, load]);

  // Returns an error message, or null on success
  const submit = async () => {
    try {
      await submitTask(roomId);
      await load();
      return null;
    } catch (err) {
      await load(); // the deadline may have just passed
      return err.message;
    }
  };

  return { ...state, submit };
}