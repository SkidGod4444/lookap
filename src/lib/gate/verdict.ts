import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/* The agent's verdict on a contact sheet. One vision call, structured JSON back.
   Runs only when credentials are present; the heuristic verdict stands alone otherwise. */

export type AgentVerdict = {
  kind: "interface" | "rendered" | "mixed" | "footage";
  cloneability: number; /* 0..100 */
  summary: string;
  components: { name: string; states: string[] }[];
  concerns: string[];
  /* for a still: motion the agent proposes, since none can be measured */
  motion: { component: string; enter: string; hover: string; press: string }[];
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "cloneability", "summary", "components", "concerns", "motion"],
  properties: {
    kind: { type: "string", enum: ["interface", "rendered", "mixed", "footage"] },
    cloneability: { type: "integer", minimum: 0, maximum: 100 },
    summary: { type: "string" },
    components: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["name", "states"], properties: { name: { type: "string" }, states: { type: "array", items: { type: "string" } } } },
    },
    concerns: { type: "array", items: { type: "string" } },
    motion: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["component", "enter", "hover", "press"], properties: { component: { type: "string" }, enter: { type: "string" }, hover: { type: "string" }, press: { type: "string" } } },
    },
  },
} as const;

const SYSTEM = `You judge whether a short video can be rebuilt as a web component by measuring its pixels.
You are shown a contact sheet of 8 frames, left to right, top to bottom, evenly spaced across the clip.
Classify the clip:
- interface: a software UI, screen recording, or a UI clip (flat fills, text, boxes, cursor). Fully cloneable.
- rendered: a 3D or motion-graphics render of a device or control. Cloneable as an approximation.
- mixed: live footage that contains a screen or device with a UI in frame. Cloneable after cropping to that region.
- footage: film, vlog, nature, people, with no interface. Not cloneable.
List the UI components you can see and the distinct states each passes through across the frames.
Score cloneability from 0 to 100: how faithfully a web build measured from these frames would match.
Keep summary to one sentence. Concerns are short phrases about what would be approximate or lost.
If the input is a single still (you are told), there is no motion to measure: for each component propose motion in three
slots, enter, hover and press, each as a short phrase with a duration, e.g. "fade up 12px, 320ms". For a clip, return motion as an empty array.`;

export function agentAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function agentVerdict(sheetJpeg: Buffer, meta: { kind: "video" | "image"; duration: number; width: number; height: number }): Promise<AgentVerdict> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 2000,
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: sheetJpeg.toString("base64") } },
          { type: "text", text: meta.kind === "image" ? `A single still, ${meta.width}x${meta.height}. Return the verdict and propose motion.` : `Clip: ${meta.duration.toFixed(1)} s, ${meta.width}x${meta.height}, eight frames shown. Return the verdict.` },
        ],
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("The model declined to assess this clip");
  const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? "{}";
  return JSON.parse(text) as AgentVerdict;
}
