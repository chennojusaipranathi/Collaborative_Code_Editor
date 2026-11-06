import { useEffect, useState } from "react";
import { getSubmissions, gradeSubmission } from "../services/examService";

export default function useSubmissions(roomId, user) {
  const [data, setData] = useState(null); // { room, submissions }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getSubmissions(roomId, user)
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
  }, [roomId, user]);

  const grade = async (id, value, feedback) => {
    const updated = await gradeSubmission(id, value, feedback, user);
    setData((d) => ({
      ...d,
      submissions: d.submissions.map((s) => (s.id === id ? updated : s)),
    }));
  };

  return { data, loading, error, grade };
}