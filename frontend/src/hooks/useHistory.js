import { useCallback, useEffect, useState } from "react";
import * as historyService from "../services/historyService";

// History of ONE file. The page remounts this when the file changes.
export default function useHistory(roomId, fileId) {
  const [data, setData] = useState(null); // { file, current, snapshots }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => historyService.getHistory(roomId, fileId), [roomId, fileId]);

  useEffect(() => {
    let active = true;
    load()
      .then((result) => active && setData(result))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [load]);

  const refresh = async () => setData(await load());

  const create = async (label) => {
    await historyService.createSnapshot(roomId, fileId, label);
    await refresh();
  };

  const restore = async (snapshotId) => {
    await historyService.restoreSnapshot(roomId, fileId, snapshotId);
    await refresh();
  };

  return { data, loading, error, refresh, create, restore };
}