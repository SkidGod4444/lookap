"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { badge, button } from "@/components/button";
import { PLAN_NAME } from "@/lib/plan-names";
import { SITE_URL } from "@/lib/site";

type KeyRow = { keyId: string; start: string; name?: string; plan: string; createdAt: number; enabled: boolean };
type Entitlement = { plan: string; interval?: string; renewsAt?: string; cancelAtPeriodEnd?: boolean; status?: string };
const PRICE: Record<string, string> = { starter: "$1 / mo", pro: "$12 / mo", team: "$39 / mo" };

/* Keys: the one page a signed-in user needs. See the plan they pay for, mint a key on it, see it once, copy it, revoke it later. */
function Account() {
  const { isLoaded, isSignedIn, user } = useUser();
  const params = useSearchParams();
  const justPaid = params.get("checkout") === "success";
  const [keys, setKeys] = useState<KeyRow[] | null>(null);
  const [ent, setEnt] = useState<Entitlement | null>(null);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<{ key: string; plan: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/keys");
    const d = await r.json();
    if (!r.ok) { setNote(d.error ?? "Could not load keys."); setKeys([]); setEnt({ plan: "none" }); return d; }
    setKeys(d.keys); setEnt(d.entitlement);
    return d;
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- the fetch resolves later; nothing is set synchronously
  useEffect(() => { if (isSignedIn) void load(); }, [isSignedIn, load]);

  /* After checkout Polar's webhook and customer state can trail the redirect by a few seconds: poll until the plan shows up. */
  useEffect(() => {
    if (!justPaid || !isSignedIn) return;
    let tries = 0;
    const id = setInterval(async () => {
      const d = await load();
      if ((d?.entitlement?.plan && d.entitlement.plan !== "none") || ++tries >= 10) clearInterval(id);
    }, 2000);
    return () => clearInterval(id);
  }, [justPaid, isSignedIn, load]);

  const mint = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setNote(null); setFresh(null);
    const r = await fetch("/api/keys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
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
        <p className="text-[14px] text-subtle">Sign in from the header to see your plan and mint a key for your agent.</p>
      </div>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const paid = ent !== null && ent.plan !== "none";
  const renews = ent?.renewsAt ? new Date(ent.renewsAt).toLocaleDateString() : null;

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-10 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-foreground">Account</h1>
        <p className="text-[14px] text-subtle">{email}</p>
      </div>

      {/* Plan */}
      <section className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-line">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-medium text-foreground">Plan</h2>
            {ent === null ? (
              <span className="text-[13px] text-subtle">Loading…</span>
            ) : paid ? (
              <span className={badge("active", "px-2.5 py-1 text-[12px]")}>{PLAN_NAME[ent.plan] ?? ent.plan}</span>
            ) : (
              <span className={badge("chip", "px-2.5 py-1 text-[12px]")}>None</span>
            )}
          </div>
          {paid ? (
            <a href="/api/portal" className={button("outline", "h-8 rounded-lg px-3 text-[12px]")}>Manage billing</a>
          ) : (
            <a href="/pricing" className={button("silver", "h-8 rounded-lg px-3 text-[12px]")}>Choose a plan</a>
          )}
        </div>
        <p className="text-[13px] text-subtle">
          {ent === null ? " " : paid
            ? ent.status === "dev" ? "Local development: billing is skipped and every account counts as Pro."
            : `${PRICE[ent.plan] ?? ""}${ent.interval === "year" ? ", billed yearly" : ""}. ${ent.cancelAtPeriodEnd ? `Ends on ${renews}.` : renews ? `Renews on ${renews}.` : ""}`
            : justPaid ? "Payment received. Waiting for Polar to confirm the subscription…" : "No active plan. Keys need one; Starter is a dollar a month."}
        </p>
      </section>

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

      <section className="flex items-center justify-between gap-4 rounded-xl bg-card px-5 py-4 ring-1 ring-line">
        <div>
          <h2 className="text-[16px] font-medium text-foreground">Moodboards</h2>
          <p className="text-[13px] text-subtle">Collections of work you have saved. Free on every account.</p>
        </div>
        <Link href="/moodboards" className={button("outline", "h-8 rounded-lg px-3 text-[12px]")}>Open</Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-foreground">Keys</h2>
        {keys === null ? (
          <p className="text-[14px] text-subtle">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-[14px] text-subtle">No keys yet.{paid ? " Mint one below." : ""}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-xl bg-card ring-1 ring-line">
            {keys.map((k) => (
              <li key={k.keyId} className="flex items-center gap-4 px-4 py-3">
                <code className="font-mono text-[13px] text-foreground">{k.start}…</code>
                <span className={badge("chip", "px-2 py-0.5 text-[11px]")}>{PLAN_NAME[k.plan] ?? k.plan}</span>
                {!k.enabled && <span className={badge("chip", "px-2 py-0.5 text-[11px]")}>off</span>}
                <span className="min-w-0 flex-1 truncate text-[13px] text-subtle">{k.name}</span>
                <span className="hidden text-[12px] text-subtle sm:inline">{new Date(k.createdAt).toLocaleDateString()}</span>
                <button type="button" onClick={() => revoke(k.keyId)} className="text-[12px] text-subtle transition-colors hover:text-foreground">Revoke</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {paid && (
        <form onSubmit={mint} className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-line">
          <h2 className="text-[16px] font-medium text-foreground">Mint a {PLAN_NAME[ent?.plan ?? ""] ?? ent?.plan} key</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, like “laptop” or “CI”" maxLength={60} className="h-10 rounded-lg bg-canvas px-3 text-[14px] text-foreground ring-1 ring-line-strong outline-none placeholder:text-subtle focus:ring-ring" />
          {note && <p className="text-[12px] text-silver">{note}</p>}
          <button type="submit" disabled={busy} className={button("silver", "h-10 self-start rounded-lg px-4 text-[13px]")}>{busy ? "Minting…" : "Create key"}</button>
          <p className="text-[12px] text-subtle">Five keys per account. Keys follow your plan: upgrade and they upgrade, cancel and they stop.</p>
        </form>
      )}
      {!paid && note && <p className="text-[12px] text-silver">{note}</p>}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><Account /></Suspense>;
}
