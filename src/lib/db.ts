import "server-only";
import { Redis } from "@upstash/redis";

/* Upstash Redis: the small, fast record we keep per user. One hash per Clerk user id with what Clerk, Polar and Unkey each know.
   Needs UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. Without them every read misses and callers fall back to live lookups. */

const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
export const dbReady = Boolean(URL_ && TOKEN);

let client: Redis | null = null;
function redis() {
  if (!URL_ || !TOKEN) throw new Error("Upstash Redis is not configured");
  client ??= new Redis({ url: URL_, token: TOKEN });
  return client;
}

export type UserRecord = {
  /* from Clerk */
  email?: string;
  name?: string;
  /* from Polar */
  polarCustomerId?: string;
  plan?: string;
  interval?: string;
  status?: string;
  subscriptionId?: string;
  renewsAt?: string;
  cancelAtPeriodEnd?: boolean;
  /* from Unkey */
  keyCount?: number;
  /* bookkeeping */
  updatedAt?: string;
  entitlementCheckedAt?: string;
};

const key = (userId: string) => `user:${userId}`;

export async function getUser(userId: string): Promise<UserRecord | null> {
  if (!dbReady) return null;
  const h = await redis().hgetall<UserRecord>(key(userId));
  return h && Object.keys(h).length ? h : null;
}

/* Merge fields in. Nothing is ever cleared except by writing an explicit value. */
export async function setUser(userId: string, patch: UserRecord) {
  if (!dbReady) return;
  const clean = Object.fromEntries(Object.entries({ ...patch, updatedAt: new Date().toISOString() }).filter(([, v]) => v !== undefined));
  await redis().hset(key(userId), clean);
  await redis().sadd("users", userId);
}

/* How stale a Polar-sourced plan may be before we ask Polar again. Webhooks refresh it the moment anything changes. */
export const ENTITLEMENT_TTL_MS = 10 * 60 * 1000;
