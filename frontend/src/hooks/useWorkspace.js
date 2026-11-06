import { useEffect, useState } from "react";
import { getWorkspace } from "../services/workspaceService";

export default function useWorkspace(roomId) {
  const [room, setRoom] = useState(null);
  const [files, setFiles] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [openIds, setOpenIds] = useState([]); // ids of files shown as tabs
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getWorkspace(roomId)
      .then((data) => {
        if (!active) return;
        setRoom(data.room);
        setFiles(data.files);
        setParticipants(data.participants);
        setOpenIds([data.files[0].id]);
        setActiveId(data.files[0].id);
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

  // Returns an error message if the name is not allowed, otherwise null
  const checkName = (name, ignoreId = null) => {
    const clean = name.trim();
    if (!clean) return "File name is required";
    if (files.some((f) => f.name === clean && f.id !== ignoreId)) {
      return "A file with this name already exists";
    }
    return null;
  };

  const openFile = (id) => {
    setOpenIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    setActiveId(id);
  };

  const closeTab = (id) => {
    const index = openIds.indexOf(id);
    const next = openIds.filter((x) => x !== id);
    setOpenIds(next);
    if (activeId === id) {
      setActiveId(next[index] ?? next[index - 1] ?? null);
    }
  };

  const createFile = (name) => {
    const problem = checkName(name);
    if (problem) return problem;
    const file = { id: crypto.randomUUID(), name: name.trim(), content: "" };
    setFiles((current) => [...current, file]);
    openFile(file.id);
    return null;
  };

  const renameFile = (id, name) => {
    const problem = checkName(name, id);
    if (problem) return problem;
    setFiles((current) =>
      current.map((f) => (f.id === id ? { ...f, name: name.trim() } : f))
    );
    return null;
  };

  const deleteFile = (id) => {
    closeTab(id);
    setFiles((current) => current.filter((f) => f.id !== id));
  };

  const updateContent = (id, content) => {
    setFiles((current) => current.map((f) => (f.id === id ? { ...f, content } : f)));
  };

  const activeFile = files.find((f) => f.id === activeId) ?? null;
  const openFiles = openIds.map((id) => files.find((f) => f.id === id)).filter(Boolean);

  return {
    room, files, participants, openFiles, activeFile, loading, error,
    openFile, closeTab, createFile, renameFile, deleteFile, updateContent,
  };
}