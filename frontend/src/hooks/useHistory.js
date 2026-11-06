import { useEffect, useState } from "react";
import * as historyService from "../services/historyService";

export default function useHistory(roomId) {
  const [data, setData] = useState(null); // { room, fileName, current, snapshots }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    historyService
      .getHistory(roomId)
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

  const createSnapshot = async (label, author) => {
    const snapshot = await historyService.createSnapshot(label, author);
    setData((d) => ({ ...d, snapshots: [snapshot, ...d.snapshots] }));
  };

  const restore = async (snapshotId) => {
    const fresh = await historyService.restoreSnapshot(roomId, snapshotId);
    setData(fresh);
  };

  return { data, loading, error, createSnapshot, restore };
}