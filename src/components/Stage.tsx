"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/* The project stage behaves like a lightbox: a click on the empty area around the media, or Escape, returns to the feed. */
export function Stage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const close = () => {
    if (typeof document !== "undefined" && document.referrer.startsWith(location.origin) && history.length > 1) router.back();
    else router.push("/feed");
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      className="flex min-w-0 flex-1 cursor-zoom-out items-center justify-center bg-gutter p-6 sm:p-10"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      role="presentation"
      title="Click outside the media to go back"
    >
      {children}
    </div>
  );
}
