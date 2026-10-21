"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { badge, button } from "@/components/button";
import { SITE_URL } from "@/lib/site";

type KeyRow = { keyId: string; start: string; name?: string; plan: string; createdAt: number; enabled: boolean };
const PLANS = [
  { id: "starter", label: "Starter", price: "$1 / mo" },
  { id: "pro", label: "Pro", price: "$12 / mo" },
  { id: "team", label: "Team", price: "$39 / mo" },
];

/* Keys: the one page a signed-in user needs. Mint a key on a plan, see it once, copy it, revoke it later. */
function Account() {
  const { isLoaded, isSignedIn, user } = useUser();
  const params = useSearchParams();
  const [keys, setKeys] = useState<KeyRow[] | null>(null);
  const [plan, setPlan] = useState(PLANS.some((p) => p.id === params.get("plan")) ? String(params.get("plan")) : "starter");
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<{ key: string; plan: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/keys");
    const d = await r.json();
    if (!r.ok) { setNote(d.error ?? "Could not load keys."); setKeys([]); return; }
    setKeys(d.keys);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- the fetch resolves later; nothing is set synchronously
  useEffect(() => { if (isSignedIn) void load(); }, [isSignedIn, load]);

  const mint = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setNote(null); setFresh(null);
    const r = await fetch("/api/keys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan, name }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setNote(d.error ?? "Could not create the key."); return; }
    setFresh({ key: d.key, plan: d.plan });
    setName("");
    void load();
  };

  const revoke = async (keyId: string) => {
    setNote(null);
    const r = await fetch("/api/keys", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ keyId }) });
    if (!r.ok) { setNote("Could not revoke that key."); return; }
    if (fresh) setFresh(null);
    void load();
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setNote("Copy failed. Select the key and copy it by hand."); }
  };

  if (!isLoaded) return null;
  if (!isSignedIn) {
    return (
      <div className="flex flex-col gap-2 py-16 text-center">
        <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-foreground">Your keys live here</h1>
        <p className="text-[14px] text-subtle">Sign in from the header to mint a key for your agent.</p>
      </div>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-10 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-foreground">Account</h1>
        <p className="text-[14px] text-subtle">{email}</p>
      </div>

      {fresh && (
        <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-line-strong">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] font-medium text-foreground">Your new {fresh.plan} key. This is the only time it is shown.</p>
            <button type="button" onClick={() => copy(fresh.key)} className={button("silver", "h-8 rounded-lg px-3 text-[12px]")}>{copied ? "Copied" : "Copy key"}</button>
          </div>
          <code className="break-all rounded-lg bg-canvas p-3 font-mono text-[13px] text-silver ring-1 ring-line select-all">{fresh.key}</code>
          <p className="text-[12px] text-subtle">Add it to Claude Code:</p>
          <pre className="overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-[12px] leading-relaxed text-silver ring-1 ring-line">{`claude mcp add --transport http lookap ${SITE_URL}/api/mcp --header "Authorization: Bearer ${fresh.key}"`}</pre>
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-foreground">Keys</h2>
        {keys === null ? (
          <p className="text-[14px] text-subtle">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-[14px] text-subtle">No keys yet. Mint one below.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-xl bg-card ring-1 ring-line">
            {keys.map((k) => (
              <li key={k.keyId} className="flex items-center gap-4 px-4 py-3">
                <code className="font-mono text-[13px] text-foreground">{k.start}…</code>
                <span className={badge("chip", "px-2 py-0.5 text-[11px] capitalize")}>{k.plan}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-subtle">{k.name}</span>
                <span className="hidden text-[12px] text-subtle sm:inline">{new Date(k.createdAt).toLocaleDateString()}</span>
                <button type="button" onClick={() => revoke(k.keyId)} className="text-[12px] text-subtle transition-colors hover:text-foreground">Revoke</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={mint} className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-line">
        <h2 className="text-[16px] font-medium text-foreground">Mint a key</h2>
        <div className="flex flex-wrap gap-2">
          {PLANS.map((p) => (
            <button key={p.id} type="button" onClick={() => setPlan(p.id)} className={badge(plan === p.id ? "active" : "chip", "px-3 py-1.5 text-[13px]")}>{p.label} <span className="ml-1 opacity-70">{p.price}</span></button>
          ))}
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, like “laptop” or “CI”" maxLength={60} className="h-10 rounded-lg bg-canvas px-3 text-[14px] text-foreground ring-1 ring-line-strong outline-none placeholder:text-subtle focus:ring-ring" />
        {note && <p className="text-[12px] text-silver">{note}</p>}
        <button type="submit" disabled={busy} className={button("silver", "h-10 self-start rounded-lg px-4 text-[13px]")}>{busy ? "Minting…" : "Create key"}</button>
        <p className="text-[12px] text-subtle">Billing is not connected yet, so keys are free to mint while we test. Five per account.</p>
      </form>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><Account /></Suspense>;
}
