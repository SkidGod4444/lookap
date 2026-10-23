import "server-only";
import { entitlementFromPolar, rememberEntitlement } from "./polar";
import { allKeys, setKey } from "./unkey";
import { kv, dbReady } from "./db";

/* The daily check. The Polar webhook switches keys on and off as subscriptions change; if every delivery of one event
   failed, a cancelled user would keep working keys (or a paying one stay locked out). Once a day this walks every key,
   asks Polar for its owner's plan right now, and fixes any key that disagrees: off when there is no plan, on and on
   the paid plan when there is one. A Polar lookup that fails leaves that owner's keys untouched, never switched off.
   A key given away by hand carries meta { comp: true } in Unkey and is skipped. */
export type Fix = { keyId: string; userId: string; was: { enabled: boolean; plan: string }; now: { enabled: boolean; plan?: string } };

export async function reconcile(opts: { dryRun?: boolean } = {}) {
  const keys = await allKeys();
  const byUser = new Map<string, typeof keys>();
  let orphans = 0, comped = 0;
  for (const k of keys) {
    if (k.comp) { comped++; continue; }
    if (!k.userId) { orphans++; continue; }
    byUser.set(k.userId, [...(byUser.get(k.userId) ?? []), k]);
  }
  const fixes: Fix[] = [];
  const failed: string[] = [];
  for (const [userId, mine] of byUser) {
    let ent;
    try { ent = await entitlementFromPolar(userId, { strict: true }); } catch { failed.push(userId); continue; }
    const paid = ent.plan !== "none" ? ent.plan : null;
    for (const k of mine) {
      const wantOn = Boolean(paid);
      if (k.enabled === wantOn && (!paid || k.plan === paid)) continue;
      fixes.push({ keyId: k.keyId, userId, was: { enabled: k.enabled, plan: k.plan }, now: { enabled: wantOn, ...(paid ? { plan: paid } : {}) } });
      if (!opts.dryRun) await setKey(k.keyId, { enabled: wantOn, ...(paid ? { plan: paid } : {}) });
    }
    if (!opts.dryRun && fixes.some((f) => f.userId === userId)) {
      await rememberEntitlement(userId, { plan: ent.plan, interval: ent.interval, status: ent.status, subscriptionId: ent.subscriptionId, renewsAt: ent.renewsAt, cancelAtPeriodEnd: ent.cancelAtPeriodEnd, polarCustomerId: ent.polarCustomerId }).catch(() => {});
    }
  }
  const report = { at: new Date().toISOString(), dryRun: Boolean(opts.dryRun), keys: keys.length, owners: byUser.size, orphans, comped, fixes, failed };
  if (dbReady && !opts.dryRun) await kv().set("reconcile:last", report, { ex: 30 * 24 * 60 * 60 }).catch(() => {});
  return report;
}
