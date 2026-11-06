import { useEffect, useState } from "react";
import * as classroomService from "../services/classroomService";

export default function useClassroom(roomId) {
  const [data, setData] = useState(null); // { room, task, students, locked }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    classroomService
      .getClassroom(roomId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [roomId]);

  const toggleLock = async () => {
    const locked = await classroomService.setLocked(!data.locked);
    setData((d) => ({ ...d, locked }));
  };

  const dismissHand = async (studentId) => {
    await classroomService.dismissHand(studentId);
    setData((d) => ({
      ...d,
      students: d.students.map((s) =>
        s.id === studentId ? { ...s, handRaised: false } : s
      ),
    }));
  };

  return { data, loading, error, toggleLock, dismissHand };
}