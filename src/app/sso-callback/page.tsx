import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/* Where OAuth providers send the browser back. Clerk finishes the sign-in or sign-up here and redirects on. */
export default function Page() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-[13px] text-subtle">
      Signing you in…
      <AuthenticateWithRedirectCallback signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" />
    </div>
  );
}
