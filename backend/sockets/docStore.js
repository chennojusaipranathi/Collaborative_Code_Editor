import * as Y from "yjs";
import File from "../models/File.js";
import Room from "../models/Room.js";

const SAVE_DELAY_MS = 1500;

// key "roomId:fileId" -> { doc, ready, timer, watchers:Set(socketId), dirty }
const docs = new Map();
const keyOf = (roomId, fileId) => `${roomId}:${fileId}`;

// Writes the current text to MongoDB (only if something changed)
async function save(key, roomId, fileId) {
  const entry = docs.get(key);
  if (!entry || !entry.dirty) return;
  entry.dirty = false;
  clearTimeout(entry.timer);

  try {
    const content = entry.doc.getText("content").toString();
    await File.updateOne({ _id: fileId, room: roomId }, { $set: { content } });
    await Room.updateOne({ _id: roomId }, { $set: { updatedAt: new Date() } });
  } catch (err) {
    entry.dirty = true; // try again on the next change or flush
    console.error("Could not save document:", err.message);
  }
}

// Returns the shared document, loading it from MongoDB the first time
export function getDoc(roomId, fileId) {
  const key = keyOf(roomId, fileId);
  if (docs.has(key)) return docs.get(key).ready;

  const doc = new Y.Doc();
  const entry = { doc, ready: null, timer: null, watchers: new Set(), dirty: false };

  entry.ready = (async () => {
    const file = await File.findOne({ _id: fileId, room: roomId });
    if (!file) {
      docs.delete(key);
      throw new Error("File not found");
    }
    doc.getText("content").insert(0, file.content);
    return doc;
  })();

  docs.set(key, entry);
  return entry.ready;
}

// Call after every applied update: saves 1.5 s after the last edit
export function markDirty(roomId, fileId) {
  const key = keyOf(roomId, fileId);
  const entry = docs.get(key);
  if (!entry) return;
  entry.dirty = true;
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => save(key, roomId, fileId), SAVE_DELAY_MS);
}

// Track who has the file open so we know when it is safe to unload
export function watch(roomId, fileId, socketId) {
  docs.get(keyOf(roomId, fileId))?.watchers.add(socketId);
}

// Stop watching. When nobody is left: save now and free the memory.
export async function unwatch(roomId, fileId, socketId) {
  const key = keyOf(roomId, fileId);
  const entry = docs.get(key);
  if (!entry) return;
  entry.watchers.delete(socketId);
  if (entry.watchers.size > 0) return;

  await save(key, roomId, fileId);
  // Re-check: someone may have joined while we were saving
  if (docs.get(key)?.watchers.size === 0) docs.delete(key);
}

// Used when a file is deleted: forget its document without saving
export function dropDoc(roomId, fileId) {
  const key = keyOf(roomId, fileId);
  clearTimeout(docs.get(key)?.timer);
  docs.delete(key);
}

// Save everything (server shutdown)
export async function flushAll() {
  await Promise.all(
    [...docs.keys()].map((key) => {
      const [roomId, fileId] = key.split(":");
      return save(key, roomId, fileId);
    })
  );
}