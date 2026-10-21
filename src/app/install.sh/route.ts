import { SITE_URL } from "@/lib/site";

/* One command, every agent:  curl -fsSL <site>/install.sh | sh -s -- lookap_KEY
   Detects the coding agents on this machine and registers lookap with each. Idempotent: running it again replaces
   the lookap entry and leaves everything else alone. Reads nothing back; the key goes only into local config files.
   Served as a script so the terminal block on /mcp is a single line. */


function script(url: string, site: string) {
  return `#!/bin/sh
# lookap installer. Registers the lookap MCP server with every coding agent found on this machine.
# Usage: curl -fsSL ${site}/install.sh | sh -s -- lookap_YOUR_KEY
set -eu

KEY="\${1:-\${LOOKAP_KEY:-}}"
URL="${url}"
AUTH="Bearer \$KEY"

if [ -z "\$KEY" ]; then
  echo "lookap: pass your key:  curl -fsSL ${site}/install.sh | sh -s -- lookap_YOUR_KEY" >&2
  echo "        keys are minted at ${site}/account" >&2
  exit 1
fi
case "\$KEY" in lookap_*) ;; *) echo "lookap: that does not look like a lookap key (they start with lookap_)" >&2; exit 1 ;; esac

found=0
ok()   { found=1; printf '  \\342\\234\\223 %s\\n' "\$1"; }
skip() { printf '  - %s\\n' "\$1"; }

# JSON merge helper: writes {"<root>":{"lookap":<entry>}} into a file, keeping other servers. Needs node or python3.
merge_json() { # file root entry_json
  f="\$1"; root="\$2"; entry="\$3"
  mkdir -p "\$(dirname "\$f")"
  if command -v node >/dev/null 2>&1; then
    node -e '
      const fs=require("fs");const [f,root,entry]=process.argv.slice(1);
      let j={};try{j=JSON.parse(fs.readFileSync(f,"utf8"))}catch{}
      j[root]=j[root]||{};j[root].lookap=JSON.parse(entry);
      fs.writeFileSync(f,JSON.stringify(j,null,2)+"\\n");' "\$f" "\$root" "\$entry"
  elif command -v python3 >/dev/null 2>&1; then
    python3 - "\$f" "\$root" "\$entry" <<'PY'
import json,sys,os
f,root,entry=sys.argv[1:4]
try: j=json.load(open(f))
except Exception: j={}
j.setdefault(root,{})["lookap"]=json.loads(entry)
json.dump(j,open(f,"w"),indent=2); open(f,"a").write("\\n")
PY
  else
    return 1
  fi
}

echo "lookap: looking for agents"

# Claude Code
if command -v claude >/dev/null 2>&1; then
  claude mcp remove --scope user lookap >/dev/null 2>&1 || true; claude mcp remove --scope local lookap >/dev/null 2>&1 || true
  if claude mcp add --transport http --scope user lookap "\$URL" --header "Authorization: \$AUTH" >/dev/null 2>&1; then ok "Claude Code (user scope, every project)"; else skip "Claude Code: claude mcp add failed"; fi
fi

# Codex: ~/.codex/config.toml, replace any existing [mcp_servers.lookap] table
if command -v codex >/dev/null 2>&1 || [ -d "\$HOME/.codex" ]; then
  f="\$HOME/.codex/config.toml"; mkdir -p "\$HOME/.codex"; touch "\$f"
  awk 'BEGIN{skip=0} /^\\[/{skip=($0=="[mcp_servers.lookap]")} !skip{print}' "\$f" > "\$f.tmp" && mv "\$f.tmp" "\$f"
  printf '\\n[mcp_servers.lookap]\\nurl = "%s"\\nhttp_headers = { Authorization = "%s" }\\n' "\$URL" "\$AUTH" >> "\$f"
  ok "Codex (~/.codex/config.toml)"
fi

# Cursor: ~/.cursor/mcp.json
if command -v cursor >/dev/null 2>&1 || [ -d "\$HOME/.cursor" ] || [ -d "/Applications/Cursor.app" ]; then
  if merge_json "\$HOME/.cursor/mcp.json" mcpServers "{\\"url\\":\\"\$URL\\",\\"headers\\":{\\"Authorization\\":\\"\$AUTH\\"}}"; then ok "Cursor (~/.cursor/mcp.json)"; else skip "Cursor: needs node or python3 to edit mcp.json"; fi
fi

# VS Code
if command -v code >/dev/null 2>&1; then
  if code --add-mcp "{\\"name\\":\\"lookap\\",\\"type\\":\\"http\\",\\"url\\":\\"\$URL\\",\\"headers\\":{\\"Authorization\\":\\"\$AUTH\\"}}" >/dev/null 2>&1; then ok "VS Code"; else skip "VS Code: code --add-mcp failed"; fi
fi

# Gemini CLI
if command -v gemini >/dev/null 2>&1; then
  gemini mcp remove --scope user lookap >/dev/null 2>&1 || true
  if gemini mcp add --transport http --scope user --header "Authorization: \$AUTH" lookap "\$URL" >/dev/null 2>&1; then ok "Gemini CLI (user scope)"; else skip "Gemini CLI: gemini mcp add failed"; fi
fi

if [ "\$found" = 0 ]; then
  echo "lookap: no agent found. Install Claude Code, Codex, Cursor, VS Code or Gemini CLI, or add it by hand: ${site}/mcp"
  exit 1
fi
echo "lookap: done. Restart the agent and ask it to search lookap."
`;
}

export function GET() {
  return new Response(script(`${SITE_URL}/api/mcp`, SITE_URL), {
    headers: { "content-type": "text/x-shellscript; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=3600" },
  });
}
