"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { badge, button } from "@/components/button";
import { PLAN_NAME } from "@/lib/plan-names";
import { DemandTable } from "@/components/DemandTable";
import { SITE_URL } from "@/lib/site";

type KeyRow = { keyId: string; start: string; name?: string; plan: string; createdAt: number; enabled: boolean };
type Entitlement = { plan: string; interval?: string; renewsAt?: string; cancelAtPeriodEnd?: boolean; status?: string };
type Meter = { used: number; limit: number; resets: string };
type Usage = { today: Meter; entries: Meter; month: (Meter & { label: string })[] };
type Loaded = { keys: KeyRow[]; entitlement: Entitlement; usage: Usage | null };

const PRICE: Record<string, { month: number; year: number }> = { starter: { month: 1, year: 10 }, pro: { month: 12, year: 120 }, team: { month: 39, year: 384 } };
const KEY_LIMIT = 5;

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const hoursLeft = (iso: string) => Math.max(1, Math.round((Date.parse(iso) - Date.now()) / 3_600_000));

/* The account page answers three questions in order: what can my agent do right now, what has it spent today,
   and which keys carry that into which machine. Billing lives in Polar's portal; this page only points at it. */
function Account() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const justPaid = params.get("checkout") === "success";
  const [data, setData] = useState<Loaded | null>(null);
  const [confirming, setConfirming] = useState<"polling" | "gaveUp" | null>(justPaid ? "polling" : null);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<{ keyId: string; key: string; plan: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [arming, setArming] = useState<string | null>(null); /* the key whose Revoke has been clicked once */

  const load = useCallback(async () => {
    const r = await fetch("/api/keys");
    const d = await r.json();
    if (!r.ok) { setNote(d.error ?? "Could not load keys."); setData({ keys: [], entitlement: { plan: "none" }, usage: null }); return d; }
    setData({ keys: d.keys, entitlement: d.entitlement, usage: d.usage ?? null });
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
      if (d?.entitlement?.plan && d.entitlement.plan !== "none") { setConfirming(null); clearInterval(id); }
      else if (++tries >= 10) { setConfirming("gaveUp"); clearInterval(id); }
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
    setFresh({ keyId: d.keyId, key: d.key, plan: d.plan, name: name.trim() });
    setName("");
    void load();
  };

  const revoke = async (keyId: string) => {
    setNote(null); setArming(null);
    const r = await fetch("/api/keys", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ keyId }) });
    if (!r.ok) { setNote("Could not revoke that key."); return; }
    if (fresh?.keyId === keyId) setFresh(null);
    void load();
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setNote("Copy failed. Select the key and copy it by hand."); }
  };

  if (!isLoaded) return null;
  if (!isSignedIn) {
    return (
      <div className="mx-auto flex max-w-[52ch] flex-col items-center gap-5 py-24 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-foreground">Your keys live here</h1>
          <p className="text-[14px] leading-[1.55] text-subtle">Sign in to see your plan, what your agent has used today, and the keys that connect it.</p>
        </div>
        <button type="button" onClick={() => router.push("/account?signin=1&next=%2Faccount")} className={button("silver", "h-9 rounded-lg px-4 text-[13px]")}>Sign in</button>
      </div>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const ent = data?.entitlement ?? null;
  const keys = data?.keys ?? null;
  const usage = data?.usage ?? null;
  const paid = ent !== null && ent.plan !== "none";
  const planName = ent ? (PLAN_NAME[ent.plan] ?? ent.plan) : "";
  const price = ent && PRICE[ent.plan];
  const planLine = ent === null
    ? ""
    : paid
      ? ent.status === "dev"
        ? "Local development: billing is skipped and every account counts as Pro."
        : [
            price ? `${PLAN_NAME[ent.plan]}, ${ent.interval === "year" ? `$${price.year} a year` : `$${price.month} a month`}.` : "",
            ent.renewsAt ? (ent.cancelAtPeriodEnd ? `Ends ${day(ent.renewsAt)}.` : `Renews ${day(ent.renewsAt)}.`) : "",
          ].filter(Boolean).join(" ")
      : confirming === "polling"
        ? "Payment received. Confirming your subscription with Polar."
        : confirming === "gaveUp"
          ? "Payment received, but the subscription has not shown up yet. Reload in a minute."
          : "No plan yet. Keys need one, and Starter is a dollar a month.";
  const visibleKeys = keys?.filter((k) => k.keyId !== fresh?.keyId) ?? null;
  const keyCount = keys?.length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-10 py-10">
      {/* who, on what */}
      <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-foreground">{user?.fullName || "Account"}</h1>
            {ent === null ? null : paid ? (
              <span className={badge("active", "px-2.5 py-1 text-[12px]")}>{planName}</span>
            ) : confirming === "polling" ? (
              <span className={badge("chip", "animate-pulse px-2.5 py-1 text-[12px]")}>Confirming</span>
            ) : (
              <span className={badge("chip", "px-2.5 py-1 text-[12px]")}>No plan</span>
            )}
          </div>
          <p className="text-[14px] text-subtle">{email}</p>
          <p className="text-[13px] text-subtle">{planLine || " "}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:pt-1">
          {ent === null ? null : paid ? (
            <a href="/api/portal" className={button("outline", "h-9 rounded-lg px-4 text-[13px]")}>Manage billing</a>
          ) : (
            <Link href="/pricing" className={button("silver", "h-9 rounded-lg px-4 text-[13px]")}>Choose a plan</Link>
          )}
        </div>
      </header>

      {/* what is left today: the same counters the MCP endpoint charges, across every key on the account */}
      {paid && usage && (
        <section className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Today</h2>
            <span className="text-[12px] text-subtle">Resets in {hoursLeft(usage.today.resets)} h</span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Gauge label="Tool calls" used={usage.today.used} limit={usage.today.limit} />
            <Gauge label="Entries opened" used={usage.entries.used} limit={usage.entries.limit} />
          </div>
          {usage.month.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-line pt-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">This month</h3>
                <span className="text-[12px] text-subtle">Resets {day(usage.month[0].resets)}</span>
              </div>
              <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {usage.month.map((m) => <Gauge key={m.label} label={m.label} used={m.used} limit={m.limit} thin />)}
              </div>
            </div>
          )}
          <p className="text-[12px] text-subtle">Every key on this account draws on the same counters. Spent for the day means your agent waits for the reset, or you move up a plan.</p>
        </section>
      )}

      {/* keys: make one, see it once, carry it into an agent, revoke it later */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Keys</h2>
          {keys !== null && <span className="text-[12px] tabular-nums text-subtle">{keyCount} of {KEY_LIMIT}</span>}
        </div>

        {paid && (
          <form onSubmit={mint} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex h-10 min-w-0 flex-1 items-center rounded-lg bg-card px-3 ring-1 ring-line focus-within:ring-[3px] focus-within:ring-ring">
              <span className="sr-only">Name for the new key</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name it after the machine, like “laptop” or “CI”" maxLength={60} className="h-full w-full min-w-0 bg-transparent text-[14px] text-foreground outline-none placeholder:text-subtle" />
            </label>
            <button type="submit" disabled={busy || keyCount >= KEY_LIMIT} className={button("silver", "h-10 shrink-0 rounded-lg px-4 text-[13px] disabled:opacity-60")}>{busy ? "Creating…" : `Create ${planName} key`}</button>
          </form>
        )}
        {note && <p className="text-[12px] text-silver">{note}</p>}

        {keys === null ? (
          <p className="text-[14px] text-subtle">Loading…</p>
        ) : keyCount === 0 && !fresh ? (
          <p className="rounded-xl bg-card px-4 py-6 text-center text-[14px] text-subtle ring-1 ring-line">
            {paid ? "No keys yet. Create one above and it is ready for your agent in a minute." : "No keys yet. Pick a plan and the first one takes a minute."}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-xl bg-card ring-1 ring-line">
            {fresh && (
              <li className="flex flex-col gap-4 rounded-t-xl bg-card-hover p-4 ring-1 ring-line-strong">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14px] font-medium text-foreground">{fresh.name || `New ${PLAN_NAME[fresh.plan] ?? fresh.plan} key`}</p>
                    <p className="text-[12px] text-subtle">Shown once. Copy it now; after you leave this page only the prefix remains.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => copy(fresh.key)} className={button("silver", "h-8 rounded-lg px-3 text-[12px]")}>{copied ? "Copied" : "Copy key"}</button>
                    <button type="button" onClick={() => setFresh(null)} className={button("outline", "h-8 rounded-lg px-3 text-[12px]")}>Done</button>
                  </div>
                </div>
                <code className="break-all rounded-lg bg-canvas p-3 font-mono text-[13px] text-silver ring-1 ring-line select-all">{fresh.key}</code>
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[12px] text-subtle">Claude Code, once in a terminal:</p>
                    <Link href="/mcp" className="text-[12px] font-medium text-subtle transition-colors hover:text-foreground">Codex, Cursor, VS Code, Gemini</Link>
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-[12px] leading-relaxed text-silver ring-1 ring-line">{`claude mcp add --transport http --scope user lookap ${SITE_URL}/api/mcp --header "Authorization: Bearer ${fresh.key}"`}</pre>
                </div>
              </li>
            )}
            {visibleKeys!.map((k) => {
              const armed = arming === k.keyId;
              return (
                <li key={k.keyId} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                  <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${k.enabled ? "bg-silver shadow-[0_0_6px_rgba(201,201,201,0.6)]" : "bg-[#3a3a3a]"}`} />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-foreground">{k.name || "Unnamed"}</span>
                  <code className="font-mono text-[12px] text-subtle">{k.start}…</code>
                  <span className={badge("chip", "px-2 py-0.5 text-[11px]")}>{k.enabled ? (PLAN_NAME[k.plan] ?? k.plan) : "Off"}</span>
                  <span className="hidden text-[12px] text-subtle sm:inline">{day(new Date(k.createdAt).toISOString())}</span>
                  {armed ? (
                    <span className="flex items-center gap-2">
                      <span className="text-[12px] text-silver">Revoke this key?</span>
                      <button type="button" onClick={() => revoke(k.keyId)} className={button("silver", "h-7 rounded-md px-2.5 text-[12px]")}>Revoke</button>
                      <button type="button" onClick={() => setArming(null)} className="text-[12px] text-subtle transition-colors hover:text-foreground">Keep</button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setArming(k.keyId)} className="text-[12px] text-subtle transition-colors hover:text-foreground">Revoke</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {paid && <p className="text-[12px] text-subtle">Keys follow the plan: move up and they move up, stop paying and they stop. Revoking one does not touch the others.</p>}
      </section>

      <nav aria-label="Also" className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-[13px] font-medium">
        <Link href="/moodboards" className="text-subtle transition-colors hover:text-foreground">Moodboards</Link>
        <Link href="/mcp" className="text-subtle transition-colors hover:text-foreground">Connect an agent</Link>
        <Link href="/pricing" className="text-subtle transition-colors hover:text-foreground">Pricing</Link>
        <Link href="/terms" className="text-subtle transition-colors hover:text-foreground">Terms</Link>
      </nav>

      <DemandTable />
    </div>
  );
}

/* An allowance drawn as the site's ruler: a dark scored track and a slider that has travelled as far as the account
   has spent. Spent all the way reads as a full silver slider. */
function Gauge({ label, used, limit, thin = false }: { label: string; used: number; limit: number; thin?: boolean }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const spent = limit > 0 && used >= limit;
  const h = thin ? 10 : 14;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className={thin ? "text-subtle" : "text-foreground"}>{label}</span>
        <span className="tabular-nums text-subtle"><span className={spent ? "text-silver-bright" : "text-foreground"}>{used}</span> of {limit}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(used, limit)}
        className="relative overflow-hidden rounded-full bg-[#080808] shadow-[inset_0_2px_5px_rgba(0,0,0,1),inset_0_1px_0_rgba(0,0,0,1),inset_0_-1px_0_rgba(255,255,255,0.14),0_1px_0_rgba(255,255,255,0.09)]"
        style={{
          height: h,
          backgroundImage: "repeating-linear-gradient(to right, transparent 0 19px, rgba(255,255,255,0.22) 19px 20px), repeating-linear-gradient(to right, transparent 0 3px, rgba(255,255,255,0.1) 3px 4px)",
          backgroundSize: `100% ${thin ? 5 : 7}px, 100% ${thin ? 3 : 4}px`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "left bottom, left bottom",
        }}
      >
        {used > 0 && (
          <div
            className={`absolute inset-y-[2px] left-[2px] rounded-full border-[1.5px] border-[#0a0a0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-[width] duration-500 ease-out ${spent ? "bg-silver" : "bg-[#4a4a4a]"}`}
            style={{ width: `max(${h - 4}px, calc(${pct}% - 4px))` }}
          />
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><Account /></Suspense>;
}
