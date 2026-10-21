"use client";

import { useState } from "react";
import { avatarUrl } from "@/lib/avatar";

/* The designer's X profile picture by handle, served from our own cached route (/api/avatar), with their initials in
   the dark slot until it loads and whenever it cannot (no handle, private account, upstream miss). */
export function Avatar({ name, x, size = 32 }: { name: string; x?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name.replace(/[^A-Za-z0-9 ]/g, "").trim().split(/\s+/).map((w) => w[0] ?? "").slice(0, 2).join("");
  const src = x && !failed ? avatarUrl(x) : null;
  return (
    <span className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#080808] text-[10px] font-semibold uppercase text-silver-bright ring-1 ring-line-strong" style={{ width: size, height: size }}>
      {initials}
      {src && (
        /* eslint-disable-next-line @next/next/no-img-element -- third-party avatar, falls back to initials on error */
        <img src={src} alt="" width={size} height={size} loading="eager" fetchPriority="high" decoding="async" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      )}
    </span>
  );
}
