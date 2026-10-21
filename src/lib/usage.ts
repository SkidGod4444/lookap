import "server-only";
import { dbReady, kv } from "./db";
import type { Plan } from "./keys";

/* Monthly quotas per account for the tools that cost us something (an image, a diff, a download). Search and the text
   tools are only rate limited per minute by Unkey. Counters live in Redis as usage:user:<id>:<month>:<tool>, so every
   key a user mints draws on one counter; they expire on their own and reset on the first of the month (UTC). A tool
   with no entry for a plan is unmetered on that plan. */
export const QUOTAS: Record<Plan, Partial<Record<string, number>>> = {
  none: {},
  starter: {},
  pro: { see_design: 500, get_recipe: 200, check_rebuild: 300, check_media: 100 },
  team: { see_design: 2000, get_recipe: 1000, check_rebuild: 1000, check_media: 300, get_rebuild: 50 },
};

export type Usage = { used: number; limit: number; resets: string };

const month = () => new Date().toISOString().slice(0, 7);
const resets = () => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10); };

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

/* Read-only view for the account page and get_usage. */
export async function usageFor(keyRef: string, plan: Plan): Promise<Record<string, Usage>> {
  const out: Record<string, Usage> = {};
  if (!dbReady) return out;
  const tools = Object.keys(QUOTAS[plan]);
  if (!tools.length) return out;
  const vals = await kv().mget<(number | null)[]>(...tools.map((t) => `usage:${keyRef}:${month()}:${t}`));
  tools.forEach((t, i) => { out[t] = { used: Number(vals[i] ?? 0), limit: QUOTAS[plan][t]!, resets: resets() }; });
  return out;
}
