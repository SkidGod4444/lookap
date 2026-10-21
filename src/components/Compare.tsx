"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

/* The project stage: one frame, two views. "Clip" is the designer's recording, "Live" is lookap's component built from
   its measurements. Both sit in the same box so the eye can compare without moving. One switch under the frame flips
   between them: a light insert sliding in a pressed slot, the same material as the chips. Posts with no rebuild yet show
   the switch locked on Clip. The clip stays mounted while hidden (it pauses off screen and resumes when shown); the
   live view mounts on first use. */
export function Compare({ clip, live, hint, style }: { clip: ReactNode; live: ReactNode | null; hint?: string; style: CSSProperties }) {
  const [isLive, setLive] = useState(false);
  const [opened, setOpened] = useState(false);
  const flip = () => { if (!live) return; setLive((v) => !v); setOpened(true); };
  return (
    <div className="flex w-full flex-col items-center gap-3" style={style}>
      <div className="relative w-full cursor-default overflow-hidden rounded-[5px] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.6)] ring-1 ring-line-strong" style={{ aspectRatio: style.aspectRatio }}>
        <div className={isLive ? "absolute inset-0 invisible" : "absolute inset-0"}>{clip}</div>
        {opened && <div className={`absolute inset-0 flex items-center justify-center ${isLive ? "" : "invisible"}`}>{live}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isLive}
        aria-label="Show the live rebuild"
        disabled={!live}
        title={live ? undefined : "No live rebuild for this post yet"}
        onClick={flip}
        className="sfx-badge relative grid h-8 w-[148px] shrink-0 grid-cols-2 items-stretch rounded-full bg-[#080808] p-[3px] text-[12px] font-medium select-none shadow-[inset_0_2px_5px_rgba(0,0,0,1),inset_0_1px_0_rgba(0,0,0,1),inset_0_-1px_0_rgba(255,255,255,0.14),0_1px_0_rgba(255,255,255,0.09)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 enabled:cursor-pointer"
      >
        <span aria-hidden="true" className={`absolute top-[3px] bottom-[3px] left-[3px] w-[calc(50%_-_3px)] rounded-full bg-[#d4d4d4] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.8)] transition-transform duration-200 ease-[cubic-bezier(.3,.7,.3,1)] ${isLive ? "translate-x-full" : ""}`} />
        <span className={`relative z-[1] flex items-center justify-center transition-colors duration-200 ${isLive ? "text-silver" : "text-[#0a0a0a]"}`}>Clip</span>
        <span className={`relative z-[1] flex items-center justify-center transition-colors duration-200 ${isLive ? "text-[#0a0a0a]" : "text-silver"}`}>Live</span>
      </button>
      <p className="text-center text-[12px] leading-[1.5] text-subtle">
        {!live ? "No live rebuild of this post yet." : isLive ? `lookap's rebuild, every size read from the clip. ${hint ?? ""}` : "The clip as recorded. Flip the switch for the rebuild."}
      </p>
    </div>
  );
}
