import * as Y from "yjs";
import File from "../models/File.js";

// key "roomId:fileId" -> { doc: Y.Doc, ready: Promise }
const docs = new Map();

const keyOf = (roomId, fileId) => `${roomId}:${fileId}`;

// Returns the shared document for a file, creating it from the database text
// the first time anyone opens it. Concurrent callers share one load.
export function getDoc(roomId, fileId) {
  const key = keyOf(roomId, fileId);
  if (docs.has(key)) return docs.get(key).ready;

  const doc = new Y.Doc();
  const ready = (async () => {
    // Match on BOTH ids so a file from another room can never be loaded here
    const file = await File.findOne({ _id: fileId, room: roomId });
    if (!file) {
      docs.delete(key);
      throw new Error("File not found");
    }
    doc.getText("content").insert(0, file.content);
    return doc;
  })();

  docs.set(key, { doc, ready });
  return ready;
}