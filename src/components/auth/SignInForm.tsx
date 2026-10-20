"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { button } from "@/components/button";
import { Divider, Field, GitHubIcon, GoogleIcon } from "./AuthShell";

type Step = "credentials" | "second-factor" | "reset-code" | "reset-password";

/* Our own sign-in: email + password, Google or GitHub, a code when Clerk asks for one, and a password reset. */
export function SignInForm() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [note, setNote] = useState<string | null>(null);
  const busy = fetchStatus === "fetching";

  const finish = async () => {
    await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        const url = decorateUrl("/");
        if (url.startsWith("http")) window.location.href = url;
        else router.push(url);
      },
    });
  };

  const afterAttempt = async () => {
    if (signIn.status === "complete") return finish();
    if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
      await signIn.mfa.sendEmailCode();
      setStep("second-factor");
    }
  };

  const submitPassword = async (fd: FormData) => {
    setNote(null);
    const { error } = await signIn.password({ emailAddress: String(fd.get("email") ?? ""), password: String(fd.get("password") ?? "") });
    if (!error) await afterAttempt();
  };

  const submitCode = async (fd: FormData) => {
    const { error } = await signIn.mfa.verifyEmailCode({ code: String(fd.get("code") ?? "") });
    if (!error && signIn.status === "complete") await finish();
  };

  const startReset = async (fd: FormData) => {
    setNote(null);
    const email = String(fd.get("email") ?? "").trim();
    if (!email) { setNote("Enter your email first, then choose reset."); return; }
    const created = await signIn.create({ identifier: email });
    if (created.error) return;
    const { error } = await signIn.resetPasswordEmailCode.sendCode();
    if (!error) setStep("reset-code");
  };

  const verifyReset = async (fd: FormData) => {
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code: String(fd.get("code") ?? "") });
    if (!error) setStep("reset-password");
  };

  const submitNewPassword = async (fd: FormData) => {
    const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password: String(fd.get("password") ?? "") });
    if (!error) await afterAttempt();
  };

  const sso = (strategy: "oauth_google" | "oauth_github") => signIn.sso({ strategy, redirectUrl: "/", redirectCallbackUrl: "/sso-callback" });

  const global = errors?.global?.[0]?.message ?? null;

  if (step === "second-factor") {
    return (
      <form action={submitCode} className="flex flex-col gap-4">
        <p className="text-[13px] text-subtle">We sent a code to your email. Enter it to finish signing in.</p>
        <Field id="code" label="Code" inputMode="numeric" autoComplete="one-time-code" autoFocus error={errors?.fields?.code?.message} />
        {global && <p className="text-[12px] text-silver">{global}</p>}
        <button type="submit" disabled={busy} className={button("silver", "h-10 w-full rounded-lg text-[13px]")}>Verify</button>
        <button type="button" onClick={() => signIn.mfa.sendEmailCode()} className="text-[12px] text-subtle hover:text-foreground">Send a new code</button>
      </form>
    );
  }

  if (step === "reset-code") {
    return (
      <form action={verifyReset} className="flex flex-col gap-4">
        <p className="text-[13px] text-subtle">Check your email for a reset code.</p>
        <Field id="code" label="Code" inputMode="numeric" autoComplete="one-time-code" autoFocus error={errors?.fields?.code?.message} />
        {global && <p className="text-[12px] text-silver">{global}</p>}
        <button type="submit" disabled={busy} className={button("silver", "h-10 w-full rounded-lg text-[13px]")}>Continue</button>
      </form>
    );
  }

  if (step === "reset-password") {
    return (
      <form action={submitNewPassword} className="flex flex-col gap-4">
        <Field id="password" label="New password" type="password" autoComplete="new-password" autoFocus error={errors?.fields?.password?.message} />
        {global && <p className="text-[12px] text-silver">{global}</p>}
        <button type="submit" disabled={busy} className={button("silver", "h-10 w-full rounded-lg text-[13px]")}>Set password and sign in</button>
      </form>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => sso("oauth_google")} disabled={busy} className={button("outline", "h-10 gap-2 rounded-lg text-[13px]")}><GoogleIcon />Google</button>
        <button type="button" onClick={() => sso("oauth_github")} disabled={busy} className={button("outline", "h-10 gap-2 rounded-lg text-[13px]")}><GitHubIcon />GitHub</button>
      </div>
      <Divider />
      <form
        action={(fd) => (fd.get("intent") === "reset" ? startReset(fd) : submitPassword(fd))}
        className="flex flex-col gap-4"
      >
        <Field id="email" label="Email" type="email" autoComplete="email" required error={errors?.fields?.identifier?.message} />
        <Field id="password" label="Password" type="password" autoComplete="current-password" error={errors?.fields?.password?.message} />
        {global && <p className="text-[12px] text-silver">{global}</p>}
        {note && <p className="text-[12px] text-silver">{note}</p>}
        <button type="submit" name="intent" value="password" disabled={busy} className={button("silver", "h-10 w-full rounded-lg text-[13px]")}>Sign in</button>
        <button type="submit" name="intent" value="reset" formNoValidate disabled={busy} className="text-[12px] text-subtle hover:text-foreground">Forgot your password?</button>
      </form>
    </div>
  );
}
