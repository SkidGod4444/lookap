"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { badge, button, noScrollbar } from "@/components/button";

/* Connect: the page's one job is a working MCP connection in under a minute.
   Key first (a fill-in, not a gate: without one every block still shows, with a marked slot), then the one command
   that registers lookap with every agent on the machine, with one-click buttons for the editors that have an install
   link, then the same thing by hand per agent for anyone who wants to see what is written, then how to tell it worked.
   The key never leaves the tab. Formats checked against each tool's docs on 2026-10-21. */

const PLACEHOLDER = "lookap_YOUR_KEY";

type Block = { label: string; code: string };
type Agent = {
  id: string;
  name: string;
  where: string;           /* what the reader does with the block */
  blocks: (url: string, key: string) => Block[];
  check: string;           /* how they know it worked */
  deeplink?: (url: string, key: string) => string;
  deeplinkLabel?: string;
};

const AGENTS: Agent[] = [
  {
    id: "claude", name: "Claude Code", where: "Run once in a terminal. User scope, so it follows you into every project.",
    blocks: (url, key) => [{ label: "terminal", code: `claude mcp add --transport http --scope user lookap ${url} \\\n  --header "Authorization: Bearer ${key}"` }],
    check: "Type /mcp inside Claude Code. lookap is listed with its tools.",
  },
  {
    id: "codex", name: "Codex", where: "Add to ~/.codex/config.toml (create it if missing), then restart Codex.",
    blocks: (url, key) => [{ label: "~/.codex/config.toml", code: `[mcp_servers.lookap]\nurl = "${url}"\nhttp_headers = { Authorization = "Bearer ${key}" }` }],
    check: "Run codex mcp list. lookap is in the table.",
  },
  {
    id: "cursor", name: "Cursor", where: "Click Add to Cursor, or add this to .cursor/mcp.json in the project (or ~/.cursor/mcp.json for every project).",
    blocks: (url, key) => [{ label: ".cursor/mcp.json", code: JSON.stringify({ mcpServers: { lookap: { url, headers: { Authorization: `Bearer ${key}` } } } }, null, 2) }],
    check: "Settings → MCP shows lookap with a green dot and its tools.",
    deeplink: (url, key) => `cursor://anysphere.cursor-deeplink/mcp/install?name=lookap&config=${encodeURIComponent(btoa(JSON.stringify({ url, headers: { Authorization: `Bearer ${key}` } })))}`,
    deeplinkLabel: "Add to Cursor",
  },
  {
    id: "vscode", name: "VS Code", where: "Add to .vscode/mcp.json in the workspace, then open Copilot in agent mode.",
    blocks: (url, key) => [{ label: ".vscode/mcp.json", code: JSON.stringify({ servers: { lookap: { type: "http", url, headers: { Authorization: `Bearer ${key}` } } } }, null, 2) }],
    check: "Command palette → MCP: List Servers. lookap is running.",
    deeplink: (url, key) => `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: "lookap", type: "http", url, headers: { Authorization: `Bearer ${key}` } }))}`,
    deeplinkLabel: "Add to VS Code",
  },
  {
    id: "gemini", name: "Gemini CLI", where: "Run once in a terminal. User scope, so it follows you into every project.",
    blocks: (url, key) => [{ label: "terminal", code: `gemini mcp add --transport http --scope user --header "Authorization: Bearer ${key}" lookap ${url}` }],
    check: "Type /mcp inside Gemini CLI. lookap is listed with its tools.",
  },
];

const PROMPTS = [
  "Search lookap for a dark booking calendar modal and rebuild it here.",
  "Get the lookap recipe for the ID card reader and match its palette and motion table exactly.",
  "Read lookap's design notes on lighting and apply them to this card.",
];

function useCopy() {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setState("done"); } catch { setState("fail"); }
    window.setTimeout(() => setState("idle"), 1600);
  };
  return { state, copy };
}

function CopyButton({ text, variant = "outline", className = "" }: { text: string; variant?: "silver" | "outline"; className?: string }) {
  const { state, copy } = useCopy();
  return (
    <button type="button" onClick={() => void copy(text)} className={button(variant, `h-8 rounded-md px-3 text-[12px] ${className}`)} aria-live="polite">
      {state === "done" ? "Copied" : state === "fail" ? "Select and copy" : "Copy"}
    </button>
  );
}

/* The code with the key lit: the reader sees exactly where their key landed, or where it is still missing.
   A terminal block gets a prompt glyph before the command and a block cursor after it, both outside the selection
   so a manual copy never picks them up. Config blocks stay plain, as a file would. */
function Code({ code, keyText, hasKey, terminal }: { code: string; keyText: string; hasKey: boolean; terminal: boolean }) {
  const parts = code.split(PLACEHOLDER);
  return (
    <pre className={`overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed select-text ${terminal ? "text-foreground" : "text-silver"}`}>
      {terminal && <span aria-hidden className="text-subtle select-none">❯ </span>}
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && (
            <span className={hasKey ? "text-foreground" : "rounded-sm bg-[rgba(255,255,255,0.08)] px-1 text-foreground"}>{keyText}</span>
          )}
        </span>
      ))}
      {terminal && <span aria-hidden className="ml-0.5 inline-block h-[1.1em] w-[0.6em] translate-y-[0.2em] bg-silver-bright align-baseline select-none motion-safe:animate-[caret_1.1s_steps(1)_infinite]" />}
    </pre>
  );
}

function Terminal({ code, keyText, hasKey }: { code: string; keyText: string; hasKey: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl bg-gutter ring-1 ring-line-strong">
      <div className="flex items-center justify-between gap-3 border-b border-line py-2 pr-2 pl-4">
        <span className="flex items-center gap-3 font-mono text-[11px] text-subtle">
          <span aria-hidden className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#3a3a3a] ring-1 ring-[rgba(255,255,255,0.08)]" />
            <span className="size-2.5 rounded-full bg-[#3a3a3a] ring-1 ring-[rgba(255,255,255,0.08)]" />
            <span className="size-2.5 rounded-full bg-[#3a3a3a] ring-1 ring-[rgba(255,255,255,0.08)]" />
          </span>
          zsh
        </span>
        <CopyButton text={code.replaceAll(PLACEHOLDER, keyText)} variant="silver" />
      </div>
      <Code code={code} keyText={keyText} hasKey={hasKey} terminal />
    </div>
  );
}

export function ConnectPanel({ url }: { url: string }) {
  const site = url.replace(/\/api\/mcp$/, "");
  const [key, setKey] = useState("");
  const [agentId, setAgentId] = useState(AGENTS[0].id);
  const pick = (id: string) => setAgentId(id);

  const agent = AGENTS.find((a) => a.id === agentId) ?? AGENTS[0];
  const hasKey = key.trim().length > 0;
  const k = hasKey ? key.trim() : PLACEHOLDER;
  /* blocks carry the sentinel; the real key is swapped in for copying and lit in the rendered code */
  const blocks = useMemo(() => agent.blocks(url, PLACEHOLDER), [agent, url]);
  const oneLine = `curl -fsSL ${site}/install.sh | sh -s -- ${PLACEHOLDER}`;
  const linked = AGENTS.filter((a) => a.deeplink);

  return (
    <div className="flex flex-col gap-8">
      {/* key */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Key</h2>
        <label className="flex h-10 items-center rounded-lg bg-card px-3 ring-1 ring-line focus-within:ring-[3px] focus-within:ring-ring">
          <span className="sr-only">Your lookap key</span>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="lookap_3f9a…"
            spellCheck={false}
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent font-mono text-[13px] text-foreground outline-none placeholder:text-subtle"
          />
        </label>
        <p className="text-[13px] text-subtle">
          No key yet? <Link href="/account" className="text-foreground underline underline-offset-2">Mint one on your account page</Link>, from a dollar a month. It stays in this tab and is never sent anywhere.
        </p>
      </section>

      {/* one command */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Install</h2>
        <p className="text-[14px] leading-[1.55] text-subtle">One command finds Claude Code, Codex, Cursor, VS Code and Gemini CLI on this machine and registers lookap with each. macOS and Linux; run it again any time to update the key.</p>
        <Terminal code={oneLine} keyText={k} hasKey={hasKey} />
        <div className="flex flex-wrap items-center gap-2">
          {linked.map((a) => hasKey ? (
            <a key={a.id} href={a.deeplink!(url, k)} className={button("outline", "h-9 rounded-lg px-4 text-[13px]")}>{a.deeplinkLabel}</a>
          ) : (
            <span key={a.id} aria-disabled className={button("outline", "h-9 rounded-lg px-4 text-[13px] opacity-40 pointer-events-none")}>{a.deeplinkLabel}</span>
          ))}
          <span className="text-[12px] text-subtle">{hasKey ? "One click, the key travels with it." : "Paste your key to enable one-click installs."}</span>
        </div>
        <p className="text-[12px] text-subtle">Rather keep the key out of shell history? Export it as LOOKAP_KEY and run the command without the trailing key.</p>
      </section>

      {/* agent */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">By hand</h2>
        <p className="text-[14px] leading-[1.55] text-subtle">The same thing, written out, if you would rather see what goes where.</p>
        <div className={`${noScrollbar} -mx-4 flex items-center gap-1.5 overflow-x-auto px-4`} aria-label="Agent">
          {AGENTS.map((a) => (
            <button key={a.id} type="button" aria-pressed={a.id === agentId} onClick={() => pick(a.id)} className={badge(a.id === agentId ? "active" : "chip", "shrink-0 px-3 py-1.5 text-[13px]")}>
              {a.name}
            </button>
          ))}
        </div>
        <p className="text-[13px] text-subtle">{agent.where}</p>
        {blocks.map((b) => {
          const terminal = b.label === "terminal";
          return (
          <div key={b.label} className={`overflow-hidden rounded-xl ${terminal ? "bg-gutter ring-1 ring-line-strong" : "bg-card ring-1 ring-line"}`}>
            <div className="flex items-center justify-between gap-3 border-b border-line py-2 pr-2 pl-4">
              <span className="flex items-center gap-3 font-mono text-[11px] text-subtle">
                {terminal && (
                  <span aria-hidden className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#3a3a3a] ring-1 ring-[rgba(255,255,255,0.08)]" />
                    <span className="size-2.5 rounded-full bg-[#3a3a3a] ring-1 ring-[rgba(255,255,255,0.08)]" />
                    <span className="size-2.5 rounded-full bg-[#3a3a3a] ring-1 ring-[rgba(255,255,255,0.08)]" />
                  </span>
                )}
                {terminal ? "zsh" : b.label}
              </span>
              <div className="flex items-center gap-2">
                <CopyButton text={b.code.replaceAll(PLACEHOLDER, k)} />
              </div>
            </div>
            <Code code={b.code} keyText={k} hasKey={hasKey} terminal={terminal} />
          </div>
          );
        })}
      </section>

      {/* check */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Check</h2>
        <p className="text-[14px] leading-[1.55] text-foreground">{agent.check}</p>
        <p className="text-[13px] text-subtle">Then ask for something. Each line below is a prompt that uses a tool.</p>
        <ul className="divide-y divide-line rounded-xl bg-card ring-1 ring-line">
          {PROMPTS.map((p) => (
            <li key={p} className="flex items-center justify-between gap-3 py-2 pr-2 pl-4">
              <span className="text-[13px] leading-[1.5] text-foreground">{p}</span>
              <CopyButton text={p} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
