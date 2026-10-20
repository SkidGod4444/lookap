import { NextResponse } from "next/server";
import { sampleBuffer, sampleVideo, type FrameSet } from "@/lib/gate/frames";
import { analyse } from "@/lib/gate/heuristics";
import { agentAvailable, agentVerdict, type AgentVerdict } from "@/lib/gate/verdict";


/* POST { url } as JSON, or multipart with a `file` field (video or image) -> the gate verdict.
   Heuristics always run; the agent verdict runs when credentials exist. */
export async function POST(req: Request) {
  try {
    const t0 = Date.now();
    let set: FrameSet;
    const ct = req.headers.get("content-type") ?? "";
    if (ct.startsWith("multipart/form-data")) {
      const file = (await req.formData()).get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "Attach a file" }, { status: 400 });
      set = await sampleBuffer(Buffer.from(await file.arrayBuffer()));
    } else {
      const { url } = (await req.json().catch(() => ({}))) as { url?: string };
      if (typeof url !== "string" || !url.trim()) return NextResponse.json({ error: "Send { url } or a file" }, { status: 400 });
      set = await sampleVideo(url.trim());
    }
    const heuristic = analyse(set.frames, set.fw, set.fh);
    let agent: AgentVerdict | null = null;
    let agentError: string | null = null;
    if (agentAvailable()) {
      try { agent = await agentVerdict(set.sheetJpeg, set); } catch (e) { agentError = e instanceof Error ? e.message : "agent failed"; }
    }
    return NextResponse.json({
      meta: { kind: set.kind, width: set.width, height: set.height, fps: Math.round(set.fps), duration: Number(set.duration.toFixed(2)), frames: set.frames.length, ms: Date.now() - t0 },
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
