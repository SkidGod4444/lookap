"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { button } from "@/components/button";

/* A plan's buy button. Signed in: asks our checkout route for a session and opens Polar's checkout in an overlay on this page.
   Signed out: opens the sign-in dialog through the header's ?signin=1, with a return path that reopens this same checkout.
   The embed script loads on first use; nothing from Polar runs on the page until someone buys. */
export function BuyButton({ plan, interval, label, primary, className = "" }: { plan: string; interval: "month" | "year"; label: string; primary?: boolean; className?: string }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const opened = useRef(false);

  const open = useCallback(async () => {
    setBusy(true); setNote(null);
    try {
      const r = await fetch(`/api/checkout?plan=${plan}&interval=${interval}&embed=1`, { headers: { accept: "application/json" } });
      const d = (await r.json()) as { url?: string; error?: string };
      if (!r.ok || !d.url) { setNote(d.error ?? "Checkout could not be started."); return; }
      const { PolarEmbedCheckout } = await import("@polar-sh/checkout/embed");
      const checkout = await PolarEmbedCheckout.create(d.url, { theme: "dark" });
      checkout.addEventListener("success", (e) => {
        /* Polar redirects to our success URL when the session asks for it; this covers the embed finishing in place. */
        const detail = (e as CustomEvent<{ redirect?: boolean }>).detail;
        if (!detail?.redirect) router.push("/account?checkout=success");
      });
    } catch {
      setNote("Checkout could not be opened. Try again.");
    } finally {
      setBusy(false);
    }
  }, [plan, interval, router]);

  const click = () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      const next = `${path}?buy=${plan}&interval=${interval}`;
      router.push(`${path}?signin=1&next=${encodeURIComponent(next)}`);
      return;
    }
    void open();
  };

  /* Back from sign-in with ?buy=<this plan>: open the checkout once, then clean the URL. */
  useEffect(() => {
    if (!isLoaded || !isSignedIn || opened.current) return;
    if (params.get("buy") === plan && (params.get("interval") ?? "month") === interval) {
      opened.current = true;
      window.history.replaceState(null, "", path);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- open() starts a fetch; the state it sets is that fetch's loading flag
      void open();
    }
  }, [isLoaded, isSignedIn, params, plan, interval, path, open]);

  return (
    <>
      <button type="button" onClick={click} disabled={busy} className={button(primary ? "silver" : "outline", className)}>{busy ? "Opening…" : label}</button>
      {note && <p className="text-[12px] text-silver">{note}</p>}
    </>
  );
}
