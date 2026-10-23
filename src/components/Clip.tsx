"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = { src: string; poster?: string; w: number; h: number; title: string; sizes: string; eager?: boolean; still?: boolean; contain?: boolean };

/* A looping clip over its first frame. The frame is a next/image, so it paints from the edge cache before any script runs.
   The video element only exists once the card is near the viewport (or at once for the first row), plays while on screen,
   and fades in over the frame when it has real pictures to show. Two hundred cards cost what the viewport shows. */
export function Clip({ src, poster, w, h, title, sizes, eager = false, still = false, contain = false }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(eager);
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    if (still || near) return;
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [still, near]);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) void el.play().catch(() => {}); else el.pause(); });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  return (
    <div ref={box} className="absolute inset-0">
      {poster ? <Image src={poster} alt={title} fill sizes={sizes} priority={eager} className={contain ? "object-contain" : "object-cover"} /> : null}
      {near && !still && (
        <video
          ref={video}
          className={`absolute inset-0 h-full w-full ${contain ? "object-contain" : "object-cover"} transition-opacity duration-300 ${showing ? "opacity-100" : "opacity-0"}`}
          src={src}
          width={w}
          height={h}
          muted
          loop
          playsInline
          autoPlay={eager}
          preload={eager ? "auto" : "none"}
          onPlaying={() => setShowing(true)}
        />
      )}
    </div>
  );
}
