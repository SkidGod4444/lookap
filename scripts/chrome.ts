/* One headless Chrome page over CDP, for the scripts that render a rebuild: open a file at a frame size, evaluate,
   screenshot, send real pointer events, close. Used by check-build.ts (seeking the demo timeline) and probe.ts
   (driving the page with gestures). The profile lives in the OS temp dir so nothing lands in the repo. */
import { spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type Page = {
  ev: (expression: string) => Promise<unknown>;
  shot: () => Promise<Buffer>;
  mouse: (type: "mousePressed" | "mouseReleased" | "mouseMoved", x: number, y: number) => Promise<unknown>;
  goto: (url: string) => Promise<void>;
  close: () => void;
};

export async function openPage(url: string, W: number, H: number): Promise<Page> {
  const port = 9400 + Math.floor(Math.random() * 200);
  const profile = path.join(tmpdir(), `lookap-chrome-${port}`);
  mkdirSync(profile, { recursive: true });
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore" });
  let targets: { type: string; webSocketDebuggerUrl: string }[] = [];
  for (let i = 0; i < 40 && !targets.length; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(250); } }
  const page = targets.find((t) => t.type === "page");
  if (!page) { chrome.kill(); throw new Error("Chrome did not start"); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map<number, (v: { result: Record<string, unknown> }) => void>();
  ws.onmessage = (m) => { const d = JSON.parse(String(m.data)); if (d.id && pending.has(d.id)) { pending.get(d.id)!(d); pending.delete(d.id); } };
  const send = (method: string, params: Record<string, unknown> = {}) => new Promise<{ result: Record<string, unknown> }>((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression: string) => ((await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result as { result: { value: unknown } }).result.value;
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  const goto = async (u: string) => {
    await send("Page.navigate", { url: u });
    await sleep(900);
    await ev("document.fonts ? document.fonts.ready.then(() => true) : true");
  };
  await goto(url);
  return {
    ev,
    goto,
    shot: async () => Buffer.from(String(((await send("Page.captureScreenshot", { format: "png" })).result as { data: string }).data), "base64"),
    mouse: (type, x, y) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 }),
    close: () => { ws.close(); chrome.kill(); setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500); },
  };
}

export { sleep };
