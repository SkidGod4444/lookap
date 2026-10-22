#!/bin/bash
# Call the lookap MCP on production the way an agent would, from a shell: one tool, JSON arguments, text back.
#   scripts/mcp-call.sh --list                         the tools the key can see, with descriptions
#   scripts/mcp-call.sh --prompt rebuild '{"slug":"x"}'  a prompt's text
#   scripts/mcp-call.sh search_designs '{"query":"faq"}'
#   scripts/mcp-call.sh look_at '{"slug":"...","what":"frame","at":2.4}' --image out.jpg   (images land in the file)
# The key is the one Claude Code already holds for this server (~/.claude.json); it is never printed.
set -e
H=${LOOKAP_MCP:-https://lookap.saidev.codes/api/mcp}
KEY=${LOOKAP_KEY:-$(python3 -c "import json,os; c=json.load(open(os.path.expanduser('~/.claude.json'))); print(c['mcpServers']['lookap']['headers']['Authorization'].split(' ',1)[1])")}
IMG=""; ARGS=(); for a in "$@"; do if [ "$PREV" = "--image" ]; then IMG="$a"; PREV=""; continue; fi; if [ "$a" = "--image" ]; then PREV="--image"; continue; fi; ARGS+=("$a"); done
rpc() { curl -s --max-time 90 -X POST $H -H "content-type: application/json" -H "accept: application/json, text/event-stream" -H "authorization: Bearer $KEY" -d "$1" | sed 's/^data: //' | grep '^{' | head -1; }
if [ "${ARGS[0]}" = "--list" ]; then
  rpc '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python3 -c "import sys,json; [print(f\"{t['name']}: {t['description'][:300]}\n  args: {list((t.get('inputSchema') or {}).get('properties',{}).keys())}\n\") for t in json.load(sys.stdin)['result']['tools']]"
  exit 0
fi
if [ "${ARGS[0]}" = "--prompt" ]; then
  rpc "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"prompts/get\",\"params\":{\"name\":\"${ARGS[1]}\",\"arguments\":${ARGS[2]:-{\}}}}" | python3 -c "import sys,json; [print(m['content']['text']) for m in json.load(sys.stdin)['result']['messages']]"
  exit 0
fi
TOOL="${ARGS[0]}"; JSON="${ARGS[1]:-{\}}"
printf '{"jsonrpc":"2.0","id":9,"method":"tools/call","params":{"name":"%s","arguments":%s}}' "$TOOL" "$JSON" > /tmp/mcp-call-$$.json
curl -s --max-time 90 -X POST $H -H "content-type: application/json" -H "accept: application/json, text/event-stream" -H "authorization: Bearer $KEY" --data-binary @/tmp/mcp-call-$$.json | sed 's/^data: //' | grep '^{' | head -1 | IMG="$IMG" python3 -c "
import sys, json, base64, os
d = json.load(sys.stdin)
if 'error' in d: print('ERROR', d['error']); sys.exit(1)
for c in d['result']['content']:
    if c['type'] == 'image':
        p = os.environ.get('IMG') or '/tmp/mcp-image.' + ('png' if 'png' in c['mimeType'] else 'jpg')
        open(p, 'wb').write(base64.b64decode(c['data'])); print(f'[image saved to {p}]')
    else: print(c['text'])
"
rm -f /tmp/mcp-call-$$.json
