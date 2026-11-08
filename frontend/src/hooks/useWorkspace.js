import { useEffect, useRef, useState } from "react";
import * as workspaceService from "../services/workspaceService";

const SAVE_DELAY_MS = 800; // wait until the user pauses typing, then save

export default function useWorkspace(roomId) {
  const [room, setRoom] = useState(null);
  const [files, setFiles] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [openIds, setOpenIds] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("saved"); // "saved" | "saving" | "error"

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

  // Update the screen instantly, then save to the server after a short pause
  const updateContent = (id, content) => {
    setFiles((current) => current.map((f) => (f.id === id ? { ...f, content } : f)));
    setSaveState("saving");

    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(async () => {
      try {
        await workspaceService.saveContent(roomId, id, content);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, SAVE_DELAY_MS);
  };

  const activeFile = files.find((f) => f.id === activeId) ?? null;
  const openFiles = openIds.map((id) => files.find((f) => f.id === id)).filter(Boolean);
  const canEdit = room ? room.myRole !== "viewer" : false;

  return {
    room, files, participants, openFiles, activeFile, loading, error, saveState, canEdit,
    openFile, closeTab, createFile, renameFile, deleteFile, updateContent,
  };
}