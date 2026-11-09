import { useEffect } from "react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";

import { colorFor } from "../utils/userColor";


// Names go into CSS, so remove anything that could break out of a string
const safe = (s) => String(s).replace(/["\\\n\r<>{}]/g, "");

// Writes one <style> block with a color and name tag for every remote cursor
function renderCursorStyles(awareness, styleEl) {
  let css = "";
  awareness.getStates().forEach((state, clientId) => {
    if (clientId === awareness.clientID || !state.user) return;
    const { name, color } = state.user;
    css += `
      .yRemoteSelection-${clientId} { background-color: ${color}40; }
      .yRemoteSelectionHead-${clientId} { border-color: ${color}; }
      .yRemoteSelectionHead-${clientId}::after { content: "${safe(name)}"; background-color: ${color}; }`;
  });
  styleEl.textContent = css;
}

// Binds the open file in Monaco to a shared Yjs document, with live cursors.
export default function useCollab({ socketRef, status, roomId, fileId, editor, canEdit, user }) {
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || status !== "connected" || !fileId || !editor || !user) return;

    const doc = new Y.Doc();
    const text = doc.getText("content");
    const awareness = new Awareness(doc);
    awareness.setLocalStateField("user", { name: user.name, color: colorFor(user.id) });

    const styleEl = document.createElement("style");
    document.head.appendChild(styleEl);

    let binding = null;
    let cancelled = false;

    // ---- document updates ----
    const onLocalUpdate = (update, origin) => {
      if (origin === "server" || !canEdit) return;
      socket.emit("yjs:update", { roomId, fileId, update });
    };
    const onRemoteUpdate = (msg) => {
      if (msg.fileId === fileId) Y.applyUpdate(doc, new Uint8Array(msg.update), "server");
    };

    // ---- awareness (cursors) ----
    const onAwarenessChange = ({ added, updated, removed }, origin) => {
      renderCursorStyles(awareness, styleEl);
      if (origin === "remote") return; // never send back what we just received
      const changed = added.concat(updated, removed);
      socket.emit("awareness:update", {
        roomId,
        fileId,
        update: encodeAwarenessUpdate(awareness, changed),
      });
    };
    const onRemoteAwareness = (msg) => {
      if (msg.fileId === fileId) applyAwarenessUpdate(awareness, new Uint8Array(msg.update), "remote");
    };
    // Someone new arrived: tell them where our cursor is
    const onAwarenessQuery = (msg) => {
      if (msg.fileId !== fileId) return;
      socket.emit("awareness:update", {
        roomId,
        fileId,
        update: encodeAwarenessUpdate(awareness, [doc.clientID]),
      });
    };

    doc.on("update", onLocalUpdate);
    awareness.on("update", onAwarenessChange);
    socket.on("yjs:update", onRemoteUpdate);
    socket.on("awareness:update", onRemoteAwareness);
    socket.on("awareness:query", onAwarenessQuery);

    socket.emit("yjs:sync", { roomId, fileId }, (res) => {
      if (cancelled || !res?.ok) return;
      Y.applyUpdate(doc, new Uint8Array(res.state), "server");
      const model = editor.getModel();
      if (!model) return;
      // Passing awareness makes y-monaco draw remote cursors and report ours
      binding = new MonacoBinding(text, model, new Set([editor]), awareness);
      socket.emit("awareness:query", { roomId, fileId });
    });

    return () => {
        // Tell the server we closed this file, so it can save and free memory
         socket.emit("yjs:unsync", { roomId, fileId });
      cancelled = true;
      // Remove our cursor for everyone else BEFORE tearing down
      removeAwarenessStates(awareness, [doc.clientID], "cleanup");
      socket.off("yjs:update", onRemoteUpdate);
      socket.off("awareness:update", onRemoteAwareness);
      socket.off("awareness:query", onAwarenessQuery);
      doc.off("update", onLocalUpdate);
      awareness.off("update", onAwarenessChange);
      binding?.destroy();
      awareness.destroy();
      doc.destroy();
      styleEl.remove();
    };
  }, [socketRef, status, roomId, fileId, editor, canEdit, user]);
}