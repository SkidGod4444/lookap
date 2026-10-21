import "server-only";
import { createHash } from "node:crypto";
import { dbReady, kv } from "./db";
import type { Plan } from "./keys";

/* Monthly quotas per account for the tools that cost us something (an image, a diff, a download). Search and the text
   tools are only rate limited per minute by Unkey. Counters live in Redis as usage:user:<id>:<month>:<tool>, so every
   key a user mints draws on one counter; they expire on their own and reset on the first of the month (UTC). A tool
   with no entry for a plan is unmetered on that plan. */
export const QUOTAS: Record<Plan, Partial<Record<string, number>>> = {
  none: {},
  starter: {},
  pro: { see_design: 500, look_at: 500, get_recipe: 200, check_rebuild: 300, check_media: 100 },
  team: { see_design: 2000, look_at: 2000, get_recipe: 1000, check_rebuild: 1000, check_media: 300, get_rebuild: 50 },
};

/* Tool calls per day per account, every tool except get_usage. The ceiling a plan is sold on: hit it, upgrade. */
export const DAILY: Record<Plan, number> = { none: 0, starter: 50, pro: 300, team: 1000 };

/* Distinct entries an account may open in a day. Building touches a handful; walking the registry trips it. */
export const BREADTH: Record<Plan, number> = { none: 0, starter: 20, pro: 40, team: 120 };

export type Usage = { used: number; limit: number; resets: string };

/* What each metered tool is called on the account page, where tool names never appear. */
export const METER_LABEL: Record<string, string> = { see_design: "Frames", look_at: "Looks", get_recipe: "Recipes", check_rebuild: "Rebuild checks", check_media: "Clip checks", get_rebuild: "Finished rebuilds" };

/* Note that an account opened an entry today. The same entry again is free; a new one past the limit is refused and
   not recorded, so the day's set never grows past the limit. */
export async function touchEntry(keyRef: string | undefined, plan: Plan, slug: string): Promise<(Usage & { ok: boolean }) | null> {
  const limit = BREADTH[plan];
  if (!limit || !keyRef || !dbReady) return null;
  const k = `breadth:${keyRef}:${day()}`;
  const r = kv();
  if (await r.sismember(k, slug)) return { used: await r.scard(k), limit, resets: tomorrow(), ok: true };
  const used = await r.scard(k);
  if (used >= limit) return { used, limit, resets: tomorrow(), ok: false };
  await r.sadd(k, slug);
  if (used === 0) r.expire(k, 2 * 24 * 60 * 60).catch(() => {});
  return { used: used + 1, limit, resets: tomorrow(), ok: true };
}

/* A short mark that names the account without exposing it: goes on every recipe, draft and source file an account
   receives, so a copy found elsewhere can be traced back. Salted so the account id cannot be recovered from it. */
export function fingerprint(keyRef: string | undefined) {
  return createHash("sha256").update(`${process.env.LOOKAP_FINGERPRINT_SALT ?? "lookap"}:${keyRef ?? "anon"}`).digest("hex").slice(0, 10);
}

const month = () => new Date().toISOString().slice(0, 7);
const day = () => new Date().toISOString().slice(0, 10);
const resets = () => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10); };
const tomorrow = () => { const d = new Date(); return `${new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)).toISOString().slice(0, 10)} 00:00 UTC`; };

/* Count one tool call against today's allowance. Null when there is no store; `ok` false means today is spent. */
export async function chargeDaily(keyRef: string | undefined, plan: Plan): Promise<(Usage & { ok: boolean }) | null> {
  const limit = DAILY[plan];
  if (!limit || !keyRef || !dbReady) return null;
  const k = `usage:${keyRef}:${day()}:calls`;
  const used = await kv().incr(k);
  if (used === 1) kv().expire(k, 2 * 24 * 60 * 60).catch(() => {});
  if (used > limit) { kv().decr(k).catch(() => {}); return { used: limit, limit, resets: tomorrow(), ok: false }; }
  return { used, limit, resets: tomorrow(), ok: true };
}

/* Count one call. Returns the month's usage, or null when the tool is unmetered on this plan or there is no store.
   `ok` false means the quota was already spent; the counter is not charged in that case. */
export async function charge(keyRef: string | undefined, plan: Plan, tool: string): Promise<(Usage & { ok: boolean }) | null> {
  const limit = QUOTAS[plan][tool];
  if (!limit || !keyRef || !dbReady) return null;
  const k = `usage:${keyRef}:${month()}:${tool}`;
  const used = await kv().incr(k);
  if (used === 1) kv().expire(k, 40 * 24 * 60 * 60).catch(() => {});
  if (used > limit) { kv().decr(k).catch(() => {}); return { used: limit, limit, resets: resets(), ok: false }; }
  return { used, limit, resets: resets(), ok: true };
}

/* Read-only view for the account page and get_usage: today's calls and the month's metered tools. */
export async function usageFor(keyRef: string, plan: Plan): Promise<{ today: Usage; entries: Usage; month: Record<string, Usage> }> {
  const month_: Record<string, Usage> = {};
  const today: Usage = { used: 0, limit: DAILY[plan], resets: tomorrow() };
  const entries: Usage = { used: 0, limit: BREADTH[plan], resets: tomorrow() };
  if (!dbReady) return { today, entries, month: month_ };
  const tools = Object.keys(QUOTAS[plan]);
  const vals = await kv().mget<(number | null)[]>(`usage:${keyRef}:${day()}:calls`, ...tools.map((t) => `usage:${keyRef}:${month()}:${t}`));
  today.used = Number(vals[0] ?? 0);
  entries.used = await kv().scard(`breadth:${keyRef}:${day()}`);
  tools.forEach((t, i) => { month_[t] = { used: Number(vals[i + 1] ?? 0), limit: QUOTAS[plan][t]!, resets: resets() }; });
  return { today, entries, month: month_ };
}
