"use client";

import { useEffect } from "react";

/* One beacon per project page per session, so the demand table knows what gets opened. Bots never reach the page
   (the proxy turns them away), and a repeat open in the same tab does not count twice. */
export function DemandPing({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const k = `seen:${slug}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {}
    const body = JSON.stringify({ slug });
    if (!navigator.sendBeacon?.("/api/demand", new Blob([body], { type: "application/json" }))) void fetch("/api/demand", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
  }, [slug]);
  return null;
}
