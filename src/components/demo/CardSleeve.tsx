"use client";

import { useEffect, useRef } from "react";

/* The ID-card reader clone from the first lookap run: every size is a measured source pixel times --u.
   Hover (or tap) inserts the card; the LCD types a report; leaving ejects it. Styles are scoped to .cs-stage. */
const CSS = `
.cs-stage{--u:min(0.5px,calc((100vw - 48px) / 1080));position:relative;width:calc(1080*var(--u));height:calc(760*var(--u));max-width:100%;margin:0 auto;cursor:pointer;
  background:radial-gradient(60% 55% at 50% 48%,rgba(255,255,255,.04),transparent 70%)}
.cs-rig{position:absolute;left:calc(289*var(--u));top:calc(40*var(--u));width:calc(518*var(--u));height:calc(700*var(--u))}
.cs-card{position:absolute;left:calc(59*var(--u));top:0;width:calc(376*var(--u));height:calc(240*var(--u));z-index:1;border-radius:calc(28*var(--u));background:#2170f5;
  box-shadow:inset 0 calc(2*var(--u)) 0 rgba(255,255,255,.28),inset 0 calc(-1*var(--u)) 0 rgba(0,0,0,.18);transform:translateY(0);transition:transform 260ms cubic-bezier(.45,0,.2,1)}
.cs-card::after{content:"";position:absolute;left:0;right:0;top:calc(122*var(--u));height:calc(36*var(--u));background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.5));transition:opacity 200ms}
.cs-rig.in .cs-card{transform:translateY(calc(118*var(--u)))}.cs-rig.in .cs-card::after{opacity:0}.cs-rig.pre .cs-card{transform:translateY(calc(8*var(--u)))}
.cs-avatar{position:absolute;left:calc(33*var(--u));top:calc(35*var(--u));width:calc(76*var(--u));height:calc(76*var(--u));border-radius:50%;background:rgba(255,255,255,.14);box-shadow:inset 0 0 0 calc(2*var(--u)) rgba(255,255,255,.42);display:grid;place-items:center}
.cs-avatar svg{width:calc(36*var(--u));height:calc(36*var(--u));stroke:#fff;fill:none;stroke-width:1.9;stroke-linecap:round}
.cs-who{position:absolute;left:calc(134*var(--u));top:calc(40*var(--u));color:#fff;font-size:calc(36*var(--u));font-weight:400;line-height:1.15;letter-spacing:-.01em;white-space:nowrap}
.cs-who small{display:block;color:#b7cdfb;font-size:calc(24*var(--u));margin-top:calc(8*var(--u))}
.cs-sleeve{position:absolute;left:0;top:calc(160*var(--u));width:calc(496*var(--u));height:calc(530*var(--u));z-index:2;border-radius:calc(30*var(--u)) calc(30*var(--u)) calc(26*var(--u)) calc(26*var(--u));
  background:linear-gradient(180deg,#181818 0%,#181818 70%,#141414 100%);
  box-shadow:inset 0 0 0 calc(1.5*var(--u)) rgba(255,255,255,.075),inset calc(3*var(--u)) calc(3*var(--u)) calc(6*var(--u)) rgba(255,255,255,.035),0 0 0 calc(1*var(--u)) rgba(255,255,255,.04),0 calc(20*var(--u)) calc(50*var(--u)) rgba(0,0,0,.8);
  -webkit-mask-image:linear-gradient(180deg,#000 0%,#000 80%,rgba(0,0,0,.55) 90%,transparent 98%);mask-image:linear-gradient(180deg,#000 0%,#000 80%,rgba(0,0,0,.55) 90%,transparent 98%)}
.cs-sleeve::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:4;
  box-shadow:inset calc(1.5*var(--u)) calc(1.5*var(--u)) 0 rgba(255,255,255,.16),inset calc(6*var(--u)) calc(4*var(--u)) calc(10*var(--u)) rgba(255,255,255,.16),inset calc(22*var(--u)) calc(10*var(--u)) calc(44*var(--u)) calc(-8*var(--u)) rgba(255,255,255,.13),inset calc(-1*var(--u)) 0 0 rgba(255,255,255,.04)}
.cs-sleeve::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,0) 60%,rgba(0,0,0,.35) 100%)}
.cs-lip{position:absolute;inset:0 0 auto 0;height:calc(118*var(--u));border-radius:calc(30*var(--u)) calc(30*var(--u)) 0 0;background:linear-gradient(180deg,#272727 0%,#1c1c1c 45%,#181818 100%);box-shadow:inset 0 calc(2*var(--u)) 0 rgba(255,255,255,.14),inset 0 0 0 calc(1.5*var(--u)) rgba(255,255,255,.05)}
.cs-lip::after{content:"";position:absolute;left:0;right:0;bottom:calc(-4*var(--u));height:calc(4*var(--u));background:linear-gradient(180deg,#080808 0%,#0b0b0b 55%,rgba(255,255,255,.07) 100%)}
.cs-lip::before{content:"";position:absolute;left:calc(47*var(--u));top:calc(40*var(--u));border-left:calc(14*var(--u)) solid transparent;border-right:calc(14*var(--u)) solid transparent;border-bottom:calc(24*var(--u)) solid #fff}
.cs-tab{position:absolute;left:calc(490*var(--u));top:calc(186*var(--u));width:calc(24*var(--u));height:calc(48*var(--u));border-radius:calc(9*var(--u));background:linear-gradient(180deg,#fff 0%,#e8e8e8 55%,#d4d4d4 100%);box-shadow:0 calc(1*var(--u)) calc(3*var(--u)) rgba(0,0,0,.8);z-index:3}
.cs-screen{position:absolute;left:calc(33*var(--u));top:calc(126*var(--u));width:calc(430*var(--u));height:calc(212*var(--u));border-radius:calc(14*var(--u));box-sizing:border-box;padding:calc(22*var(--u)) calc(20*var(--u)) 0 calc(28*var(--u));
  background:radial-gradient(circle at calc(4*var(--u)) calc(4*var(--u)),#171717 calc(1.4*var(--u)),transparent calc(2.2*var(--u))) 0 0/calc(8*var(--u)) calc(8*var(--u)),#0f0f0f;
  box-shadow:inset 0 calc(3*var(--u)) calc(6*var(--u)) rgba(0,0,0,.95),inset 0 0 0 calc(1*var(--u)) rgba(0,0,0,.7),0 0 0 calc(1.5*var(--u)) rgba(255,255,255,.06);
  font-family:var(--font-doto),"Doto",ui-monospace,Menlo,monospace;font-weight:700;font-variation-settings:"ROND" 100;font-size:calc(32*var(--u));letter-spacing:.01em;line-height:calc(44.7*var(--u));display:grid;grid-template-rows:repeat(4,calc(44.7*var(--u)))}
.cs-row{display:flex;justify-content:space-between;align-items:center;gap:8px}
.cs-lbl{color:#858585;transition:color 220ms}.cs-rig.in .cs-lbl{color:#f0f0f0;text-shadow:0 0 calc(4*var(--u)) rgba(255,255,255,.22)}
.cs-val{display:inline-flex;align-items:center;gap:calc(14*var(--u));color:#858585;white-space:nowrap}.cs-val .t{min-height:1em}
.cs-val .ok{width:calc(26*var(--u));height:calc(26*var(--u));color:#11d04a;transform:scale(0);transition:transform 160ms cubic-bezier(.34,1.56,.64,1);filter:drop-shadow(0 0 calc(5*var(--u)) rgba(17,208,74,.55))}
.cs-val .ok svg{width:100%;height:100%;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.cs-val.done .ok{transform:scale(1)}
.cs-ridges{position:absolute;left:calc(33*var(--u));top:calc(368*var(--u));width:calc(430*var(--u));height:calc(162*var(--u));display:flex;justify-content:space-between;align-items:flex-start}
.cs-ridges i{width:calc(28*var(--u));height:100%;border-radius:calc(14*var(--u)) calc(14*var(--u)) 0 0;background:linear-gradient(180deg,#0c0c0c 0%,#111 30%,#181818 100%);
  box-shadow:inset 0 calc(2*var(--u)) calc(2*var(--u)) rgba(0,0,0,.9),inset calc(1*var(--u)) 0 0 rgba(0,0,0,.5),inset calc(-1*var(--u)) 0 0 rgba(0,0,0,.5),0 calc(-1.5*var(--u)) 0 rgba(255,255,255,.12),calc(1.5*var(--u)) 0 0 rgba(255,255,255,.06),calc(-1.5*var(--u)) 0 0 rgba(255,255,255,.06)}
@media (prefers-reduced-motion:reduce){.cs-card,.cs-lbl,.cs-val .ok{transition:none}}
/* measurement callouts: hairline dimension lines and mono labels in the product's silver, placed in source units */
.cs-co{position:absolute;inset:0;pointer-events:none;z-index:5;font-family:ui-monospace,Menlo,monospace;font-size:calc(22*var(--u));color:#c9c9c9;letter-spacing:.02em}
.cs-co .l{position:absolute;background:rgba(201,201,201,.55)}
.cs-co .l.h{height:1px}.cs-co .l.v{width:1px}
.cs-co .l.h::before,.cs-co .l.h::after{content:"";position:absolute;top:calc(-5*var(--u));width:1px;height:calc(11*var(--u));background:rgba(201,201,201,.7)}
.cs-co .l.h::before{left:0}.cs-co .l.h::after{right:0}
.cs-co .l.v::before,.cs-co .l.v::after{content:"";position:absolute;left:calc(-5*var(--u));height:1px;width:calc(11*var(--u));background:rgba(201,201,201,.7)}
.cs-co .l.v::before{top:0}.cs-co .l.v::after{bottom:0}
.cs-co .t{position:absolute;white-space:nowrap;background:rgba(0,0,0,.72);padding:calc(3*var(--u)) calc(8*var(--u));border-radius:calc(6*var(--u));box-shadow:0 0 0 1px rgba(255,255,255,.12)}
.cs-co .sw{display:inline-block;width:calc(14*var(--u));height:calc(14*var(--u));border-radius:50%;vertical-align:-10%;margin-right:calc(6*var(--u));box-shadow:0 0 0 1px rgba(0,0,0,.6)}
`;

const ROWS: [string, string][] = [["Identity", "Verified"], ["Access", "Restricted"], ["Data", "Restricted"], ["AI usage", "Limited"]];

export function CardSleeve({ callouts = false }: { callouts?: boolean }) {
  const rig = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const r = rig.current!, s = stage.current!;
    const vals = Array.from(r.querySelectorAll<HTMLElement>(".cs-val"));
    const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
    const type = (el: HTMLElement, text: string, done: () => void) => {
      const t = el.querySelector<HTMLElement>(".t")!; t.textContent = ""; let i = 0;
      const step = () => { if (i <= text.length) { t.textContent = text.slice(0, i++); timers.current.push(window.setTimeout(step, 22)); } else done(); };
      step();
    };
    const insert = () => {
      clear(); r.classList.remove("pre"); r.classList.add("in"); let k = 0;
      const next = () => { if (k >= vals.length) return; const v = vals[k++]; timers.current.push(window.setTimeout(() => type(v, v.dataset.v!, () => { v.classList.add("done"); next(); }), k === 1 ? 260 : 60)); };
      next();
    };
    const eject = () => { clear(); r.classList.remove("in", "pre"); vals.forEach((v) => { v.classList.remove("done"); v.querySelector<HTMLElement>(".t")!.textContent = ""; }); };
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const enter = () => { r.classList.add("pre"); timers.current.push(window.setTimeout(insert, 350)); };
    const click = () => (r.classList.contains("in") ? eject() : insert());
    if (fine) { s.addEventListener("mouseenter", enter); s.addEventListener("mouseleave", eject); } else { s.addEventListener("click", click); }
    return () => { clear(); s.removeEventListener("mouseenter", enter); s.removeEventListener("mouseleave", eject); s.removeEventListener("click", click); };
  }, []);

  return (
    <div ref={stage} className="cs-stage" aria-label="ID card reader demo. Hover or tap to insert the card.">
      <style>{CSS}</style>
      <div ref={rig} className="cs-rig">
        <div className="cs-card">
          <div className="cs-avatar"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg></div>
          <div className="cs-who">Jordan Lee<small>Acme, Inc.</small></div>
        </div>
        <div className="cs-sleeve">
          <div className="cs-lip" />
          <div className="cs-screen">
            {ROWS.map(([k, v]) => (
              <div key={k} className="cs-row"><span className="cs-lbl">{k}</span><span className="cs-val" data-v={v}><span className="t" /><span className="ok"><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 7" /></svg></span></span></div>
            ))}
          </div>
          <div className="cs-ridges"><i /><i /><i /><i /><i /><i /><i /><i /></div>
        </div>
        <div className="cs-tab" />
      </div>
      {callouts && (
        <div className="cs-co" aria-hidden="true">
          {/* card width: 376 px across its top edge (card top at y 40 in this stage) */}
          <i className="l h" style={{ left: "calc(348 * var(--u))", top: "calc(22 * var(--u))", width: "calc(376 * var(--u))" }} />
          <span className="t" style={{ left: "calc(740 * var(--u))", top: "calc(6 * var(--u))" }}>376 px · r 28</span>
          {/* sleeve height: 530 px down its left edge */}
          <i className="l v" style={{ left: "calc(268 * var(--u))", top: "calc(200 * var(--u))", height: "calc(530 * var(--u))" }} />
          <span className="t" style={{ left: "calc(120 * var(--u))", top: "calc(450 * var(--u))" }}>530 px</span>
          {/* the one colour, sampled */}
          <span className="t" style={{ left: "calc(800 * var(--u))", top: "calc(84 * var(--u))" }}><span className="sw" style={{ background: "#2170f5" }} />#2170f5</span>
          {/* the insert timing, read from the clip */}
          <span className="t" style={{ left: "calc(800 * var(--u))", top: "calc(560 * var(--u))" }}>insert 250 ms</span>
        </div>
      )}
    </div>
  );
}
