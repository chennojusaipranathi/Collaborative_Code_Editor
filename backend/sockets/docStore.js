import * as Y from "yjs";
import File from "../models/File.js";
import Room from "../models/Room.js";
import VersionSnapshot from "../models/VersionSnapshot.js";


const SAVE_DELAY_MS = 1500;
const AUTO_SNAPSHOT_GAP_MS = 5 * 60 * 1000; // at most one automatic snapshot per 5 minutes


// key "roomId:fileId" -> { doc, ready, timer, watchers:Set(socketId), dirty }
const docs = new Map();
const keyOf = (roomId, fileId) => `${roomId}:${fileId}`;

// Creates an automatic snapshot, unless nothing changed or one was made recently
async function maybeAutoSnapshot(file, content) {
  if (!content.trim()) return;
  const last = await VersionSnapshot.findOne({ file: file._id }).sort({ createdAt: -1 });
  if (last && (last.content === content || Date.now() - last.createdAt.getTime() < AUTO_SNAPSHOT_GAP_MS)) {
    return;
  }
  await VersionSnapshot.create({
    room: file.room,
    file: file._id,
    fileName: file.name,
    label: "Auto-save",
    type: "auto",
    authorName: "Auto-save",
    content,
  });
}

// Writes the current text to MongoDB (only if something changed)
async function save(key, roomId, fileId) {
  const entry = docs.get(key);
  if (!entry || !entry.dirty) return;
  entry.dirty = false;
  clearTimeout(entry.timer);

  try {
    const content = entry.doc.getText("content").toString();
       const file = await File.findOneAndUpdate({ _id: fileId, room: roomId }, { $set: { content } }, { new: true });
    if (file) await maybeAutoSnapshot(file, content);
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



// Current text: from the live document if it is loaded, otherwise from MongoDB
export async function currentContent(roomId, fileId) {
  const entry = docs.get(keyOf(roomId, fileId));
  if (entry) {
    const doc = await entry.ready;
    return doc.getText("content").toString();
  }
  const file = await File.findOne({ _id: fileId, room: roomId });
  return file ? file.content : null;
}

// Replaces the whole text. Returns a Yjs update to broadcast, or null if the
// document is not loaded (then only MongoDB is updated).
export async function replaceContent(roomId, fileId, content) {
  const entry = docs.get(keyOf(roomId, fileId));

  if (!entry) {
    await File.updateOne({ _id: fileId, room: roomId }, { $set: { content } });
    await Room.updateOne({ _id: roomId }, { $set: { updatedAt: new Date() } });
    return null;
  }

  const doc = await entry.ready;
  let update = null;
  const capture = (u) => {
    update = u;
  };
  doc.on("update", capture);
  doc.transact(() => {
    const text = doc.getText("content");
    text.delete(0, text.length);
    text.insert(0, content);
  }, "restore");
  doc.off("update", capture);

  markDirty(roomId, fileId);
  return update;
}