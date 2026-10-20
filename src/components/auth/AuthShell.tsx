import Link from "next/link";
import { Mark } from "@/components/Mark";

/* The frame both auth pages share: mark, title, one line, the form, a swap link. One panel on the canvas. */
export function AuthShell({ title, line, children, swap }: { title: string; line: string; children: React.ReactNode; swap: { text: string; href: string; label: string } }) {
  return (
    <div className="flex flex-1 items-start justify-center py-12 sm:items-center">
      <div className="w-full max-w-[400px] rounded-2xl bg-card p-6 ring-1 ring-line sm:p-8">
        <Mark size={36} />
        <h1 className="mt-5 text-[22px] leading-[1.2] font-medium tracking-[-0.02em] text-foreground">{title}</h1>
        <p className="mt-1.5 text-[13px] leading-[1.55] text-subtle">{line}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-[13px] text-subtle">
          {swap.text} <Link href={swap.href} className="font-medium text-foreground underline-offset-2 hover:underline">{swap.label}</Link>
        </p>
      </div>
    </div>
  );
}

export function Field({ id, label, error, ...rest }: { id: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-medium text-foreground">{label}</label>
      <input
        id={id}
        name={id}
        className="h-10 rounded-lg bg-canvas px-3 text-[14px] text-foreground ring-1 ring-line-strong outline-none transition-shadow placeholder:text-subtle focus:ring-ring"
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error && <p className="text-[12px] text-silver">{error}</p>}
    </div>
  );
}

export function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-[11px] tracking-[.06em] text-subtle uppercase">
      <span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z" opacity=".9" /><path fill="currentColor" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" opacity=".75" /><path fill="currentColor" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9l3.3-2.5Z" opacity=".6" /><path fill="currentColor" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5L6.4 10C7.2 7.8 9.4 6 12 6Z" opacity=".45" /></svg>
  );
}

export function GitHubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.5 9.5 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" /></svg>
  );
}
