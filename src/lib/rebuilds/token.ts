import { createHmac, timingSafeEqual } from "node:crypto";

/* The Live view's address is signed: the project page mints a token for the slug and the signed-in member, at
   request time, good for thirty minutes, and the frame route refuses the file without it. Together with the fetch
   metadata the route also checks, the address cannot be opened on its own, fetched, hotlinked or kept, and the copy
   it serves carries that member's mark. */
const SALT = () => process.env.LOOKAP_FINGERPRINT_SALT ?? "";
const sign = (slug: string, exp: number, user: string) => createHmac("sha256", SALT()).update(`live:${slug}:${exp}:${user}`).digest("base64url").slice(0, 27);

export function liveToken(slug: string, user: string) {
  const exp = Math.floor(Date.now() / 1000) + 30 * 60;
  return `${exp}.${user}.${sign(slug, exp, user)}`;
}

/* the member the token was minted for, or null */
export function checkLiveToken(slug: string, token: string | null): string | null {
  if (!token || !SALT()) return null;
  const [e, user = "", sig = ""] = token.split(".");
  const exp = Number(e);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000 || !user) return null;
  const want = sign(slug, exp, user);
  return sig.length === want.length && timingSafeEqual(Buffer.from(sig), Buffer.from(want)) ? user : null;
}
