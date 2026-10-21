"use client";

import { useEffect } from "react";

/* Deters casual inspection in production: no context menu, no devtools / view-source / save shortcuts, no image
   dragging. Inputs, editable fields and <code> keep their native menu so forms and the key on /account still work.
   Off in development so the dev server stays debuggable. This is a deterrent only; nothing client-side can stop
   view-source:, curl, or a user with JavaScript disabled. */

function editable(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true'], pre, code");
}

/* Letters are matched on e.code: on macOS, Option changes e.key (Option+I is a dead key), so e.key would miss Cmd+Option+I. */
function blockedKey(e: KeyboardEvent) {
  if (e.key === "F12") return true;
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return false;
  const c = e.code;
  if (e.shiftKey && (c === "KeyI" || c === "KeyJ" || c === "KeyC" || c === "KeyK")) return true; // devtools, console, picker (Firefox K)
  if (e.altKey && (c === "KeyI" || c === "KeyJ" || c === "KeyC" || c === "KeyU")) return true; // Safari / Mac Chrome
  if (!e.shiftKey && !e.altKey && (c === "KeyU" || c === "KeyS")) return true; // view-source, save page
  return false;
}

export function NoInspect() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const onContext = (e: MouseEvent) => { if (!editable(e.target)) e.preventDefault(); };
    const onKey = (e: KeyboardEvent) => { if (blockedKey(e)) { e.preventDefault(); e.stopPropagation(); } };
    const onDrag = (e: DragEvent) => { if ((e.target as HTMLElement | null)?.tagName === "IMG") e.preventDefault(); };
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("dragstart", onDrag);
    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("dragstart", onDrag);
    };
  }, []);
  return null;
}
