import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = { title: "Sign in · lookap" };

export default function Page() {
  return (
    <AuthShell title="Welcome back" line="Sign in to manage your keys and saved designs." swap={{ text: "New here?", href: "/sign-up", label: "Create an account" }}>
      <SignInForm />
    </AuthShell>
  );
}
