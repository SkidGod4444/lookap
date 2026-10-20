"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Mark } from "@/components/Mark";
import { button } from "@/components/button";

/* Hook errors wrap the API error; the account-not-found code can sit on the wrapper or on the first inner error. */
function isUnknownAccount(err: { code?: string; errors?: { code?: string }[] }) {
  return [err.code, ...(err.errors ?? []).map((e) => e.code)].includes("form_identifier_not_found");
}

type Step = "email" | "name" | "code";

const field =
  "h-11 w-full rounded-[10px] bg-card text-[14px] text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_1px_2px_rgba(0,0,0,0.4)] outline-none transition-shadow placeholder:text-subtle hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28),0_0_0_3px_rgba(255,255,255,0.08)] disabled:opacity-60";

/* Three of our own posters, fanned under the bottom edge the way a hand of cards sits on a table. */
const FAN = [
  { src: "/demos/typewriter.jpg", fx: "-29cqw", fy: "26px", fr: "-14deg", fs: "0.88", w: 120, h: 120, delay: "60ms" },
  { src: "/demos/card-reader.jpg", fx: "0px", fy: "0px", fr: "0deg", fs: "1", w: 160, h: 120, delay: "0ms" },
  { src: "/mascot.png", fx: "29cqw", fy: "26px", fr: "14deg", fs: "0.88", w: 120, h: 120, delay: "120ms", tile: true },
];

/* The only way in: an email and the code we send to it. Known addresses sign in; new ones give a name first, then become accounts.
   Rendered through a portal so the header's backdrop filter cannot trap the fixed overlay. Layout follows the same bones as
   Vibrant's dialog (title row, a hairline band holding the form card, a poster fan peeking under the edge) in our dark silver tokens. */
export function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, fetchStatus: inStatus } = useSignIn();
  const { signUp, fetchStatus: upStatus } = useSignUp();
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const busy = inStatus === "fetching" || upStatus === "fetching";

  const close = () => { setStep("email"); setNote(null); onClose(); };
  const done = () => { close(); router.refresh(); };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close only changes identity, not behaviour
  }, [open]);

  const navigate = ({ decorateUrl }: { decorateUrl: (u: string) => string }) => {
    const url = decorateUrl(window.location.pathname);
    if (url.startsWith("http")) window.location.href = url;
    else done();
  };

  /* Step 1: try to sign in. An unknown address moves to the name step instead. */
  const sendCode = async (fd: FormData) => {
    setNote(null);
    const address = String(fd.get("email") ?? "").trim();
    setEmail(address);
    const tried = await signIn.emailCode.sendCode({ emailAddress: address });
    if (!tried.error) { setMode("in"); setStep("code"); return; }
    if (isUnknownAccount(tried.error)) { setMode("up"); setStep("name"); return; }
    setNote(tried.error.message);
  };

  /* Step 1b, new accounts: name, then the code. */
  const createAccount = async (fd: FormData) => {
    setNote(null);
    const created = await signUp.create({ emailAddress: email, firstName: String(fd.get("firstName") ?? "").trim(), lastName: String(fd.get("lastName") ?? "").trim() });
    if (created.error) { setNote(created.error.message); return; }
    const sent = await signUp.verifications.sendEmailCode();
    if (sent.error) { setNote(sent.error.message); return; }
    setStep("code");
  };

  /* Step 2: the code. */
  const verify = async (fd: FormData) => {
    setNote(null);
    const code = String(fd.get("code") ?? "").trim();
    if (mode === "in") {
      const { error } = await signIn.emailCode.verifyCode({ code });
      if (error) { setNote(error.message); return; }
      if (signIn.status === "complete") await signIn.finalize({ navigate });
      else setNote("One more check is needed on this account. Try again.");
    } else {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) { setNote(error.message); return; }
      if (signUp.status === "complete") await signUp.finalize({ navigate });
      else setNote(`Still missing: ${signUp.missingFields.join(", ") || "something"}. Try again.`);
    }
  };

  const resend = () => (mode === "in" ? signIn.emailCode.sendCode({ emailAddress: email }) : signUp.verifications.sendEmailCode());

  if (!open || typeof document === "undefined") return null;

  const line =
    step === "email" ? "Enter your email. We send a code, you type it, done. No password."
    : step === "name" ? <>No account for <span className="text-foreground">{email}</span> yet. Your name goes on your keys and credits.</>
    : <>We sent a six-digit code to <span className="text-foreground">{email}</span>.</>;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-[6px] motion-safe:animate-[dlg-overlay_160ms_ease-out]"
      onPointerDown={(e) => { if (!box.current?.contains(e.target as Node)) close(); }}
    >
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="fixed top-1/2 left-1/2 w-[calc(100%_-_2rem)] max-w-[448px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-card pt-10 pb-0 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_32px_80px_rgba(0,0,0,0.75)] motion-safe:animate-[dlg-panel_180ms_cubic-bezier(0.2,0.8,0.2,1)]"
      >
        <button type="button" onClick={close} aria-label="Close" className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-subtle transition-colors hover:bg-chip hover:text-foreground">
          <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>

        {/* Title row: "Sign in to [mark] lookap", the brand link's hover animation included. */}
        <h2 id="auth-title" className="group/brand flex items-center justify-center gap-2.5 px-6 text-[24px] leading-none font-semibold tracking-[-0.025em] text-balance text-foreground">
          <span>{step === "name" ? "Welcome to" : step === "code" ? "Check your email" : "Sign in to"}</span>
          {step !== "code" && (<><Mark size={26} /><span>lookap</span></>)}
        </h2>
        <p className="mx-auto mt-3 max-w-[340px] px-4 text-center text-[12px] leading-5 text-pretty text-subtle">{line}</p>

        {/* The band: two hairlines run the full width of the panel; the form card sits between them. */}
        <div className="relative mt-8 p-3">
          <div aria-hidden="true" className="pointer-events-none absolute top-0 left-1/2 h-px w-screen -translate-x-1/2 bg-line" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/2 h-px w-screen -translate-x-1/2 bg-line" />
          <div key={step} className="rounded-xl bg-canvas p-6 shadow-[0_1px_2px_rgba(0,0,0,0.4)] ring-1 ring-line motion-safe:animate-[dlg-step_300ms_cubic-bezier(0.2,0.8,0.2,1)] sm:p-7">
            {step === "email" && (
              <form action={sendCode} className="flex flex-col gap-3">
                <div className="relative">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7.5 10.5 12.3a3 3 0 0 0 3 0L21 7.5M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>
                  <input name="email" type="email" required autoFocus autoComplete="email" defaultValue={email} aria-label="Email" placeholder="Enter your email address" className={`${field} pr-3 pl-10`} />
                </div>
                {note && <p className="px-1 text-[12px] text-silver">{note}</p>}
                <button type="submit" disabled={busy} className={button("silver", "mt-1 h-11 w-full rounded-xl text-[14px]")}>{busy ? "Sending…" : "Continue"}</button>
              </form>
            )}

            {step === "name" && (
              <form action={createAccount} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <input name="firstName" required autoFocus autoComplete="given-name" aria-label="First name" placeholder="First name" className={`${field} px-3.5`} />
                  <input name="lastName" required autoComplete="family-name" aria-label="Last name" placeholder="Last name" className={`${field} px-3.5`} />
                </div>
                {note && <p className="px-1 text-[12px] text-silver">{note}</p>}
                <button type="submit" disabled={busy} className={button("silver", "mt-1 h-11 w-full rounded-xl text-[14px]")}>{busy ? "Sending…" : "Create account"}</button>
                <button type="button" onClick={() => setStep("email")} className="self-center text-[12px] text-subtle transition-colors hover:text-foreground">Use a different email</button>
              </form>
            )}

            {step === "code" && (
              <form action={verify} className="flex flex-col gap-3">
                <input
                  name="code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  aria-label="Six-digit code"
                  placeholder="······"
                  className={`${field} h-13 px-3 text-center font-mono text-[24px] tracking-[0.45em] placeholder:tracking-[0.45em]`}
                />
                {note && <p className="px-1 text-[12px] text-silver">{note}</p>}
                <button type="submit" disabled={busy} className={button("silver", "mt-1 h-11 w-full rounded-xl text-[14px]")}>{busy ? "Checking…" : "Continue"}</button>
                <div className="flex items-center justify-between px-1 text-[12px] text-subtle">
                  <button type="button" onClick={() => setStep("email")} className="transition-colors hover:text-foreground">Different email</button>
                  <button type="button" onClick={() => void resend()} className="transition-colors hover:text-foreground">Send again</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* The fan: three posters rise from below the edge, outer two tilted. Clipped by the panel so they read as tucked under. */}
        <div aria-hidden="true" className="relative mt-6 h-[96px] [container-type:inline-size]">
          {FAN.map((f) => (
            // eslint-disable-next-line @next/next/no-img-element -- decorative posters, fixed sizes
            <img
              key={f.src}
              src={f.src}
              alt=""
              width={f.w}
              height={f.h}
              draggable={false}
              className={`absolute top-2 left-1/2 rounded-[6px] object-cover shadow-[0_6px_16px_rgba(0,0,0,0.6),0_1px_3px_rgba(0,0,0,0.5)] ring-1 ring-white/10 motion-safe:animate-[dlg-fan_520ms_cubic-bezier(0.2,0.9,0.25,1.15)_both] ${f.tile ? "bg-[linear-gradient(180deg,#ececec_0%,#cfcfcf_50%,#a8a8a8_100%)] p-3" : "bg-[#0a0a0a]"}`}
              style={{ width: f.w, height: f.h, marginLeft: -f.w / 2, transformOrigin: "50% 100%", animationDelay: f.delay, ["--fx" as string]: f.fx, ["--fy" as string]: f.fy, ["--fr" as string]: f.fr, ["--fs" as string]: f.fs, zIndex: f.fr === "0deg" ? 5 : 1 }}
            />
          ))}
        </div>
        <div id="clerk-captcha" />
      </div>
    </div>,
    document.body,
  );
}
