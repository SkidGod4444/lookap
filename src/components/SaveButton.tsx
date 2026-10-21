"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { badge, button } from "./button";
import { createBoard, loadBoards, toggleItem, useBoards } from "@/lib/boards-client";

/* The bookmark on a card. Signed out, it opens sign-in and comes back here. Signed in, it opens a picker of the
   person's moodboards: tick to add, untick to remove, or make a new one in place. Filled when the entry is on any board. */
/* `className` must position the wrapper (relative or absolute); the picker is anchored to it. */
export function SaveButton({ slug, className = "relative", label = false }: { slug: string; className?: string; label?: boolean }) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const { boards, loading, error } = useBoards();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isSignedIn) void loadBoards(); }, [isSignedIn]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const saved = Boolean(boards?.some((b) => b.slugs.includes(slug)));

  const onClick = () => {
    if (!isSignedIn) { const path = window.location.pathname; router.push(`${path}?signin=1&next=${encodeURIComponent(path)}`); return; }
    setNote(null);
    setOpen((v) => !v);
  };

  const toggle = async (id: string, on: boolean) => {
    setNote(null);
    try { await toggleItem(id, slug, on); } catch (e) { setNote(e instanceof Error ? e.message : "Could not save."); }
  };

  const make = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true); setNote(null);
    try { const b = await createBoard(name); setName(""); await toggleItem(b.id, slug, true); }
    catch (err) { setNote(err instanceof Error ? err.message : "Could not create."); }
    finally { setBusy(false); }
  };

  return (
    <div ref={ref} className={className}>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={saved ? "Saved. Change moodboards" : "Save to a moodboard"}
        title={saved ? "Saved" : "Save"}
        className={badge(saved ? "silver" : "dark", `${label ? "h-8 gap-1.5 px-3 text-[12px]" : "size-7"} cursor-pointer`)}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4Z" /></svg>
        {label && (saved ? "Saved" : "Save")}
      </button>

      {open && (
        <div role="dialog" aria-label="Moodboards" className="absolute top-9 right-0 z-[75] w-[240px] rounded-xl bg-card p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] ring-1 ring-line-strong">
          <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Save to</p>
          {loading && !boards ? (
            <p className="px-2.5 py-2 text-[13px] text-subtle">Loading…</p>
          ) : error ? (
            <p className="px-2.5 py-2 text-[13px] text-silver">{error}</p>
          ) : boards && boards.length ? (
            <ul className="max-h-[220px] overflow-y-auto">
              {boards.map((b) => {
                const on = b.slugs.includes(slug);
                return (
                  <li key={b.id}>
                    <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(b.id, !on)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-chip">
                      <span className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] ring-1 ${on ? "bg-silver-bright text-[#0a0a0a] ring-silver-bright" : "ring-line-strong"}`}>
                        {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{b.name}</span>
                      <span className="font-mono text-[11px] text-subtle">{b.slugs.length}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-2.5 py-2 text-[13px] text-subtle">No moodboards yet. Make the first one below.</p>
          )}
          <form onSubmit={make} className="mt-1 flex items-center gap-1.5 border-t border-line pt-1.5">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New moodboard" maxLength={40} className="h-8 min-w-0 flex-1 rounded-lg bg-canvas px-2.5 text-[13px] text-foreground ring-1 ring-line outline-none placeholder:text-subtle focus:ring-ring" />
            <button type="submit" disabled={busy || !name.trim()} className={button("outline", "h-8 rounded-lg px-2.5 text-[12px] disabled:opacity-50")}>Add</button>
          </form>
          {note && <p className="px-2.5 pt-1.5 text-[12px] text-silver">{note}</p>}
        </div>
      )}
    </div>
  );
}
