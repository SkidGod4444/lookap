import { NextResponse } from "next/server";
import { sampleVideo } from "@/lib/gate/frames";
import { analyse } from "@/lib/gate/heuristics";
import { agentAvailable, agentVerdict, type AgentVerdict } from "@/lib/gate/verdict";


/* POST { url } -> the gate verdict. Heuristics always run; the agent verdict runs when credentials exist. */
export async function POST(req: Request) {
  let url: string;
  try {
    ({ url } = (await req.json()) as { url: string });
    if (typeof url !== "string" || !url.trim()) throw new Error();
  } catch {
    return NextResponse.json({ error: "Send { url }" }, { status: 400 });
  }

  try {
    const t0 = Date.now();
    const set = await sampleVideo(url.trim());
    const heuristic = analyse(set.frames, set.fw, set.fh);
    let agent: AgentVerdict | null = null;
    let agentError: string | null = null;
    if (agentAvailable()) {
      try { agent = await agentVerdict(set.sheetJpeg, set); } catch (e) { agentError = e instanceof Error ? e.message : "agent failed"; }
    }
    return NextResponse.json({
      meta: { width: set.width, height: set.height, fps: Math.round(set.fps), duration: Number(set.duration.toFixed(2)), frames: set.frames.length, ms: Date.now() - t0 },
      sheet: `data:image/jpeg;base64,${set.sheetJpeg.toString("base64")}`,
      heuristic,
      agent,
      agentAvailable: agentAvailable(),
      agentError,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gate failed" }, { status: 422 });
  }
}
