"use client";

import { useEffect, useRef } from "react";

/* A looping clip that only plays while it is on screen, so a feed of two hundred videos costs what the viewport shows.
   Autoplay is muted and inline; the browser decides when to start fetching from the metadata preload. */
export function Clip({ src, w, h }: { src: string; w: number; h: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} className="absolute inset-0 h-full w-full object-cover" src={src} width={w} height={h} muted loop playsInline preload="none" />;
}
