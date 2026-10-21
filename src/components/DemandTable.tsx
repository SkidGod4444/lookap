"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hrefFor } from "./FeedCard";
import { bySlug } from "@/lib/data";

type Row = { slug: string; title: string; author: string; score: number; saves: number; agent: number; views: number; measured: boolean };

/* The rebuild queue, for the admin account only: entries by demand, with what drove it and whether a recipe exists. */
export function DemandTable() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => { void fetch("/api/demand").then((r) => (r.ok ? r.json() : null)).then((d) => setRows(d?.rows ?? null)).catch(() => {}); }, []);
  if (!rows) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[16px] font-medium text-foreground">Demand</h2>
      <p className="text-[13px] text-subtle">What to measure and rebuild next. Score counts a save as five, an agent read as three, an open as one.</p>
      {rows.length === 0 ? (
        <p className="text-[13px] text-subtle">Nothing counted yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-line">
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-subtle [&>th]:px-3 [&>th]:py-2 [&>th]:font-medium"><th>Entry</th><th className="text-right">Score</th><th className="text-right">Saves</th><th className="text-right">Agent</th><th className="text-right">Opens</th><th>Recipe</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const e = bySlug(r.slug);
                return (
                  <tr key={r.slug} className="[&>td]:px-3 [&>td]:py-2">
                    <td className="max-w-[28ch] truncate">{e ? <Link href={hrefFor(e)} className="text-foreground hover:underline underline-offset-2">{r.title}</Link> : r.title}<span className="block truncate text-[11px] text-subtle">{r.author}</span></td>
                    <td className="text-right tabular-nums text-foreground">{r.score}</td>
                    <td className="text-right tabular-nums text-subtle">{r.saves}</td>
                    <td className="text-right tabular-nums text-subtle">{r.agent}</td>
                    <td className="text-right tabular-nums text-subtle">{r.views}</td>
                    <td className="text-subtle">{r.measured ? "measured" : "queue"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
