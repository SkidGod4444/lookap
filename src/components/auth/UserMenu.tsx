"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";

/* Signed-in control: the avatar, and a small menu with the account and a sign-out. */
export function UserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!user) return null;
  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const name = user.fullName || email.split("@")[0];
  const initial = (name[0] ?? "?").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
        className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(180deg,#ececec_0%,#cfcfcf_50%,#a8a8a8_100%)] text-[12px] font-semibold text-[#0a0a0a] ring-1 ring-line-strong"
      >
        {user.hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote avatar, sized by the ring
          <img src={user.imageUrl} alt="" className="size-full object-cover" />
        ) : initial}
      </button>
      {open && (
        <div role="menu" className="absolute top-10 right-0 w-[220px] rounded-xl bg-card p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] ring-1 ring-line-strong">
          <div className="px-2.5 py-2">
            <p className="truncate text-[13px] font-medium text-foreground">{name}</p>
            <p className="truncate text-[12px] text-subtle">{email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link href="/account" role="menuitem" onClick={() => setOpen(false)} className="block rounded-lg px-2.5 py-2 text-[13px] text-subtle transition-colors hover:bg-chip hover:text-foreground">Account and keys</Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full rounded-lg px-2.5 py-2 text-left text-[13px] text-subtle transition-colors hover:bg-chip hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
