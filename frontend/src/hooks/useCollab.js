import { useEffect } from "react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";

// Binds the open file in Monaco to a shared Yjs document.
// Re-runs when the file changes, so each file gets its own document.
export default function useCollab({ socketRef, status, roomId, fileId, editor, canEdit }) {
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || status !== "connected" || !fileId || !editor) return;

    const doc = new Y.Doc();
    const text = doc.getText("content");
    let binding = null;
    let cancelled = false;

    // Local edits go to the server. The "server" origin marks updates that
    // CAME from the server, so we never send them back (no echo loop).
    const onLocalUpdate = (update, origin) => {
      if (origin === "server" || !canEdit) return;
      socket.emit("yjs:update", { roomId, fileId, update });
    };

    // Updates from other people
    const onRemoteUpdate = (msg) => {
      if (msg.fileId === fileId) Y.applyUpdate(doc, new Uint8Array(msg.update), "server");
    };

    doc.on("update", onLocalUpdate);
    socket.on("yjs:update", onRemoteUpdate);

    // Ask for the current document, then connect it to Monaco
    socket.emit("yjs:sync", { roomId, fileId }, (res) => {
      if (cancelled || !res?.ok) return;
      Y.applyUpdate(doc, new Uint8Array(res.state), "server");
      const model = editor.getModel();
      if (!model) return;
      // The binding replaces the editor text with the shared text and keeps them in sync
      binding = new MonacoBinding(text, model, new Set([editor]));
    });

    // Cleanup: remove listeners, unbind, free memory
    return () => {
      cancelled = true;
      socket.off("yjs:update", onRemoteUpdate);
      doc.off("update", onLocalUpdate);
      binding?.destroy();
      doc.destroy();
    };
  }, [socketRef, status, roomId, fileId, editor, canEdit]);
}