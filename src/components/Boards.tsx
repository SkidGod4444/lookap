"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ENTRIES, type Entry } from "@/lib/data";
import { button } from "./button";
import { FeedGrid } from "./FeedGrid";
import { Media, TILE_SIZES } from "./Media";
import { createBoard, deleteBoard, loadBoards, renameBoard, useBoards, type Board as BoardT } from "@/lib/boards-client";

function SignedOut() {
  return (
    <div className="flex flex-col gap-2 py-16 text-center">
      <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-foreground">Your moodboards live here</h1>
      <p className="text-[14px] text-subtle">Sign in from the header, then press the bookmark on any card to start one.</p>
    </div>
  );
}

const entriesOf = (b: BoardT) => ENTRIES.filter((e) => b.slugs.includes(e.slug));

/* The list: one tile per moodboard, a 2x2 of its first four entries as the cover, and a form to start a new one. */
export function Boards() {
  const { isLoaded, isSignedIn } = useUser();
  const { boards, loading, error } = useBoards();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => { if (isSignedIn) void loadBoards(); }, [isSignedIn]);
  if (!isLoaded) return null;
  if (!isSignedIn) return <SignedOut />;

  const make = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setNote(null);
    try { await createBoard(name); setName(""); } catch (err) { setNote(err instanceof Error ? err.message : "Could not create."); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-8 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-foreground">Moodboards</h1>
        <p className="max-w-[62ch] text-[14px] leading-[1.55] text-subtle">Collections of work you want to come back to. Press the bookmark on any card to add it to one.</p>
      </header>

      <form onSubmit={make} className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New moodboard, like “pricing” or “dark heroes”" maxLength={40} className="h-10 min-w-0 flex-1 rounded-lg bg-card px-3 text-[14px] text-foreground ring-1 ring-line outline-none placeholder:text-subtle focus:ring-ring" />
        <button type="submit" disabled={busy || !name.trim()} className={button("silver", "h-10 rounded-lg px-4 text-[13px] disabled:opacity-50")}>Create</button>
      </form>
      {note && <p className="text-[12px] text-silver">{note}</p>}
      {error && <p className="text-[13px] text-silver">{error}</p>}

      {boards === null && loading ? (
        <p className="text-[14px] text-subtle">Loading…</p>
      ) : boards && boards.length === 0 ? (
        <p className="text-[14px] text-subtle">No moodboards yet. Name one above, or <Link href="/feed" className="text-foreground underline underline-offset-2">browse the feed</Link> and press a bookmark.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(boards ?? []).map((b) => {
            const four = entriesOf(b).slice(0, 4);
            return (
              <li key={b.id}>
                <Link href={`/moodboards/${b.id}`} className="group block overflow-hidden rounded-xl bg-card ring-1 ring-line transition-shadow hover:ring-line-strong">
                  <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-px bg-line">
                    {[0, 1, 2, 3].map((i) => four[i] ? (
                      <span key={four[i].slug} className="relative block overflow-hidden bg-canvas"><Media entry={four[i]} sizes={TILE_SIZES} compact /></span>
                    ) : <span key={i} className="block bg-canvas" />)}
                  </div>
                  <div className="flex items-baseline justify-between gap-3 px-3 py-2.5">
                    <span className="truncate text-[14px] font-medium text-foreground">{b.name}</span>
                    <span className="font-mono text-[12px] text-subtle">{b.slugs.length}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* One moodboard: its grid, a rename in place, and a delete that asks once. */
export function Board() {
  const { id } = useParams<{ id: string }>();
  const { isLoaded, isSignedIn } = useUser();
  const { boards, loading } = useBoards();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => { if (isSignedIn) void loadBoards(); }, [isSignedIn]);
  if (!isLoaded) return null;
  if (!isSignedIn) return <SignedOut />;
  const board = boards?.find((b) => b.id === id);
  if (!board) {
    return <p className="py-16 text-center text-[14px] text-subtle">{boards === null || loading ? "Loading…" : <>No such moodboard. <Link href="/moodboards" className="text-foreground underline underline-offset-2">All moodboards</Link></>}</p>;
  }
  const entries: Entry[] = entriesOf(board);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await renameBoard(board.id, name); setEditing(false); } catch (err) { setNote(err instanceof Error ? err.message : "Could not rename."); }
  };
  const remove = async () => {
    try { await deleteBoard(board.id); router.push("/moodboards"); } catch (err) { setNote(err instanceof Error ? err.message : "Could not delete."); }
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      <header className="flex flex-wrap items-center gap-3">
        <Link href="/moodboards" className="text-[13px] text-subtle hover:text-foreground">Moodboards</Link>
        <span className="text-subtle">/</span>
        {editing ? (
          <form onSubmit={save} className="flex items-center gap-2">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="h-9 rounded-lg bg-card px-3 text-[15px] text-foreground ring-1 ring-line outline-none focus:ring-ring" />
            <button type="submit" className={button("silver", "h-8 rounded-lg px-3 text-[12px]")}>Save</button>
            <button type="button" onClick={() => setEditing(false)} className="text-[13px] text-subtle hover:text-foreground">Cancel</button>
          </form>
        ) : (
          <h1 className="text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-foreground">{board.name}</h1>
        )}
        <span className="font-mono text-[12px] text-subtle">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
        <div className="ml-auto flex items-center gap-3 text-[13px]">
          {!editing && <button type="button" onClick={() => { setName(board.name); setEditing(true); }} className="text-subtle hover:text-foreground">Rename</button>}
          {confirm ? (
            <>
              <span className="text-subtle">Delete this moodboard?</span>
              <button type="button" onClick={remove} className={button("outline", "h-8 rounded-lg px-3 text-[12px]")}>Delete</button>
              <button type="button" onClick={() => setConfirm(false)} className="text-subtle hover:text-foreground">Keep</button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} className="text-subtle hover:text-foreground">Delete</button>
          )}
        </div>
      </header>
      {note && <p className="text-[12px] text-silver">{note}</p>}
      {entries.length === 0 ? (
        <p className="py-10 text-center text-[14px] text-subtle">Nothing here yet. <Link href="/feed" className="text-foreground underline underline-offset-2">Browse the feed</Link> and press the bookmark on a card.</p>
      ) : (
        <FeedGrid entries={entries} hero={false} />
      )}
    </div>
  );
}
