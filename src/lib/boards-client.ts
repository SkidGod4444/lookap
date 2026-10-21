"use client";

import { useSyncExternalStore } from "react";

/* The signed-in person's moodboards, fetched once per session and shared by every save button on the page.
   Mutations update the store first so icons flip at once, then call the API; a failure reloads from the server. */
export type Board = { id: string; name: string; createdAt: string; slugs: string[] };
type State = { boards: Board[] | null; loading: boolean; error: string | null };

let state: State = { boards: null, loading: false, error: null };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; emit(); };

export async function loadBoards(force = false) {
  if (state.loading || (state.boards && !force)) return;
  set({ loading: true, error: null });
  try {
    const r = await fetch("/api/boards", { cache: "no-store" });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error ?? "Could not load moodboards.");
    set({ boards: d.boards, loading: false });
  } catch (e) {
    set({ loading: false, error: e instanceof Error ? e.message : "Could not load moodboards." });
  }
}

export function resetBoards() { state = { boards: null, loading: false, error: null }; emit(); }

export function useBoards() {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => state, () => state);
}

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "Something went wrong.");
  return d;
}

export async function createBoard(name: string): Promise<Board> {
  const d = await call("/api/boards", "POST", { name });
  set({ boards: [...(state.boards ?? []), d.board] });
  return d.board;
}

export async function renameBoard(id: string, name: string) {
  await call(`/api/boards/${id}`, "PATCH", { name });
  set({ boards: (state.boards ?? []).map((b) => (b.id === id ? { ...b, name } : b)) });
}

export async function deleteBoard(id: string) {
  await call(`/api/boards/${id}`, "DELETE");
  set({ boards: (state.boards ?? []).filter((b) => b.id !== id) });
}

export async function toggleItem(id: string, slug: string, on: boolean) {
  const before = state.boards;
  set({ boards: (state.boards ?? []).map((b) => (b.id === id ? { ...b, slugs: on ? [...new Set([...b.slugs, slug])] : b.slugs.filter((s) => s !== slug) } : b)) });
  try { await call(`/api/boards/${id}/items`, on ? "POST" : "DELETE", { slug }); }
  catch (e) { set({ boards: before }); throw e; }
}
