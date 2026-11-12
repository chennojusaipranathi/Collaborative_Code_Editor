import { useCallback, useEffect, useState } from "react";
import * as workspaceService from "../services/workspaceService";


export default function useWorkspace(roomId) {
  const [room, setRoom] = useState(null);
  const [files, setFiles] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [openIds, setOpenIds] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState] = useState("saved");

  const timers = useRef({}); // fileId -> pending save timer

  useEffect(() => {
    let active = true;

    workspaceService
      .getWorkspace(roomId)
      .then((data) => {
        if (!active) return;
        setRoom(data.room);
        setFiles(data.files);
        setParticipants(data.participants);
        const first = data.files[0];
        setOpenIds(first ? [first.id] : []);
        setActiveId(first ? first.id : null);
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

  // These three return an error message (string) or null
  const createFile = async (name) => {
    const problem = checkName(name);
    if (problem) return problem;
    try {
      const file = await workspaceService.createFile(roomId, name.trim());
      setFiles((current) => [...current, file]);
      openFile(file.id);
      return null;
    } catch (err) {
      return err.message;
    }
  };

  const renameFile = async (id, name) => {
    const problem = checkName(name, id);
    if (problem) return problem;
    try {
      const updated = await workspaceService.renameFile(roomId, id, name.trim());
      setFiles((current) => current.map((f) => (f.id === id ? { ...f, name: updated.name } : f)));
      return null;
    } catch (err) {
      return err.message;
    }
  };

  const deleteFile = async (id) => {
    try {
      await workspaceService.deleteFile(roomId, id);
      clearTimeout(timers.current[id]); // no point saving a deleted file
      closeTab(id);
      setFiles((current) => current.filter((f) => f.id !== id));
      return null;
    } catch (err) {
      return err.message;
    }
  };

    // The server saves content now (from the shared Yjs document).
  // This only keeps the local copy fresh for things like the Problems panel.
  const updateContent = (id, content) => {
    setFiles((current) => current.map((f) => (f.id === id ? { ...f, content } : f)));
  };

  const activeFile = files.find((f) => f.id === activeId) ?? null;
  const openFiles = openIds.map((id) => files.find((f) => f.id === id)).filter(Boolean);
  const canEdit = room ? room.myRole !== "viewer" : false;
    // Reload the room (my role) and the people list without touching files or tabs
  const refreshMembers = useCallback(async () => {
    try {
      const data = await workspaceService.getMembers(roomId);
      setRoom(data.room);
      setParticipants(data.participants);
    } catch {
      // keep what we have; the next event or a refresh will try again
    }
  }, [roomId]);

  return {
    room, files, participants, openFiles, activeFile, loading, error, saveState, canEdit,
    openFile, closeTab, createFile, renameFile, deleteFile, updateContent,refreshMembers
  };
}