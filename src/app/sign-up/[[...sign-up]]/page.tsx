import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = { title: "Sign up · lookap" };

export default function Page() {
  return (
    <AuthShell title="Create your account" line="One account for your keys, your agent and the registry." swap={{ text: "Already have one?", href: "/sign-in", label: "Sign in" }}>
      <SignUpForm />
    </AuthShell>
  );
}
