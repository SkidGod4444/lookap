"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { button } from "@/components/button";
import { Divider, Field, GitHubIcon, GoogleIcon } from "./AuthShell";

/* Our own sign-up: email + password, Google or GitHub, then the email code Clerk requires before the account is live. */
export function SignUpForm() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const busy = fetchStatus === "fetching";

  const finish = async () => {
    await signUp.finalize({
      navigate: ({ decorateUrl }) => {
        const url = decorateUrl("/");
        if (url.startsWith("http")) window.location.href = url;
        else router.push(url);
      },
    });
  };

  const submit = async (fd: FormData) => {
    const { error } = await signUp.password({ emailAddress: String(fd.get("email") ?? ""), password: String(fd.get("password") ?? "") });
    if (error) return;
    if (signUp.status === "complete") return finish();
    const sent = await signUp.verifications.sendEmailCode();
    if (!sent.error) setVerifying(true);
  };

  const verify = async (fd: FormData) => {
    const { error } = await signUp.verifications.verifyEmailCode({ code: String(fd.get("code") ?? "") });
    if (!error && signUp.status === "complete") await finish();
  };

  const sso = (strategy: "oauth_google" | "oauth_github") => signUp.sso({ strategy, redirectUrl: "/", redirectCallbackUrl: "/sso-callback" });

  const global = errors?.global?.[0]?.message ?? null;

  if (verifying) {
    return (
      <form action={verify} className="flex flex-col gap-4">
        <p className="text-[13px] text-subtle">We sent a code to your email. Enter it to finish creating your account.</p>
        <Field id="code" label="Code" inputMode="numeric" autoComplete="one-time-code" autoFocus error={errors?.fields?.code?.message} />
        {global && <p className="text-[12px] text-silver">{global}</p>}
        <button type="submit" disabled={busy} className={button("silver", "h-10 w-full rounded-lg text-[13px]")}>Verify</button>
        <button type="button" onClick={() => signUp.verifications.sendEmailCode()} className="text-[12px] text-subtle hover:text-foreground">Send a new code</button>
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
      <form action={submit} className="flex flex-col gap-4">
        <Field id="email" label="Email" type="email" autoComplete="email" required error={errors?.fields?.emailAddress?.message} />
        <Field id="password" label="Password" type="password" autoComplete="new-password" required minLength={8} error={errors?.fields?.password?.message} />
        {global && <p className="text-[12px] text-silver">{global}</p>}
        <button type="submit" disabled={busy} className={button("silver", "h-10 w-full rounded-lg text-[13px]")}>Create account</button>
        <p className="text-[11px] leading-[1.5] text-subtle">By continuing you agree to the <a href="/terms" className="underline-offset-2 hover:underline">terms</a> and <a href="/privacy" className="underline-offset-2 hover:underline">privacy policy</a>.</p>
      </form>
      {/* Clerk's bot protection renders here when it is turned on for the instance. */}
      <div id="clerk-captcha" />
    </div>
  );
}
