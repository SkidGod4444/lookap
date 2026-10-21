import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { CATEGORIES, NOTES, RECIPES, SECTION_NAMES, briefFor, facets, publicEntry, searchEntries, similarEntries } from "@/lib/registry";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { bySlug } from "@/lib/data";
import { LIMITS, resolvePlan, type Plan } from "@/lib/keys";
import { sampleVideo } from "@/lib/gate/frames";
import { analyse } from "@/lib/gate/heuristics";

/* lookap MCP: the design registry for agents. Stateless Streamable HTTP, one server per request.
   Add it to Claude Code with:
     claude mcp add --transport http lookap https://<host>/api/mcp --header "Authorization: Bearer <key>"
   Without a key every tool answers with a pointer to pricing. */

const text = (v: unknown) => ({ content: [{ type: "text" as const, text: typeof v === "string" ? v : JSON.stringify(v, null, 2) }] });
const REASONS: Record<string, string> = {
  missing: "needs a key. Starter is $1 a month at /pricing. Send it as Authorization: Bearer <key>.",
  NOT_FOUND: "got a key lookap does not recognise. Check it at /account, or get one at /pricing.",
  DISABLED: "got a key that is switched off. Manage it at /account.",
  EXPIRED: "got an expired key. Get a new one at /account.",
  RATE_LIMITED: "is over this key's rate limit. Slow down for a minute, or move to a higher plan at /pricing.",
  USAGE_EXCEEDED: "has used up this key's credits for the period.",
  NOT_CONFIGURED: "cannot verify keys right now: the server has no Unkey configuration.",
};
const gated = (what: string, plan: Plan, reason?: string) =>
  text({ error: plan === "none" ? `${what} ${REASONS[reason ?? "missing"] ?? REASONS.missing}` : `${what} needs a Pro or Team key. Upgrade at /pricing.` });

/* The entry's frame as base64. Own demos live in public/; catalog frames come from the CDN. */
async function loadFrame(poster: string): Promise<{ data: string; mimeType: string }> {
  if (poster.startsWith("/")) {
    const buf = await readFile(path.join(process.cwd(), "public", poster.replace(/^\//, "")));
    return { data: buf.toString("base64"), mimeType: poster.endsWith(".png") ? "image/png" : "image/jpeg" };
  }
  const res = await fetch(poster, { headers: { "user-agent": "lookap-registry/0.2" }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`frame fetch failed: ${res.status}`);
  const mimeType = res.headers.get("content-type")?.split(";")[0] || "image/webp";
  return { data: Buffer.from(await res.arrayBuffer()).toString("base64"), mimeType };
}

function build(plan: Plan, reason?: string) {
  const lim = LIMITS[plan];
  const server = new McpServer(
    { name: "lookap", version: "0.2.0" },
    {
      instructions:
        "lookap is a design registry for coding agents: curated interfaces (components, sections, full pages) with media, traits and credits, measured recipes for a few, and design notes. " +
        "Reach for it when asked to design, redesign, polish or rebuild UI, or for inspiration and reference: search_designs to find, see_design to look at the frame, get_brief or get_recipe for how to rebuild, similar_designs to widen, list_notes for guidance. " +
        "Every tool needs a key (Starter $1/mo at /pricing); see_design, get_recipe and check_media need Pro.",
    },
  );
  const ro = { readOnlyHint: true, idempotentHint: true, openWorldHint: false } as const;

  server.registerTool(
    "search_designs",
    {
      title: "Search the registry",
      description: "Find curated interfaces by words, with optional filters. Title hits rank first, then types, then description. An empty query with filters browses. Returns slugs for get_design, see_design and get_brief, plus the catalog's facets so you learn its vocabulary. Needs a key.",
      inputSchema: {
        query: z.string().describe("words to match in title, category, types or description; empty to browse with filters"),
        category: z.string().optional().describe(`one of: ${CATEGORIES.join(", ")}`),
        section: z.string().optional().describe(`a page section such as ${SECTION_NAMES.slice(0, 6).join(", ")}; matches category or types`),
        kind: z.enum(["feed", "website", "launch", "og"]).optional().describe("feed: a component or interaction; website: a full page; launch: a product film; og: a share card"),
        tone: z.enum(["light", "dark", "color"]).optional(),
        author: z.string().optional().describe("designer name or X handle"),
        limit: z.number().int().min(1).max(100).optional(),
      },
      annotations: ro,
    },
    async ({ query, category, section, kind, tone, author, limit }) => {
      if (plan === "none") return gated("search_designs", plan, reason);
      const rows = searchEntries(query, { category, section, kind, tone, author, limit: Math.min(limit ?? lim.search, lim.search) }).map(publicEntry);
      return text({ plan, count: rows.length, results: rows, facets: facets() });
    },
  );

  server.registerTool(
    "get_design",
    {
      title: "Get one design",
      description: "Full record for a slug: attribution, category, types, demo clip when lookap owns one, and the measured recipe when one exists (paid).",
      inputSchema: { slug: z.string() },
      annotations: ro,
    },
    async ({ slug }) => {
      if (plan === "none") return gated("get_design", plan, reason);
      const e = bySlug(slug);
      if (!e) return text({ error: `No entry ${slug}` });
      const pub = publicEntry(e);
      const recipe = pub.recipe ? RECIPES.find((r) => r.slug === pub.recipe) : null;
      return text({ ...pub, recipe: recipe ? (lim.recipes ? recipe : { slug: recipe.slug, title: recipe.title, locked: true }) : null });
    },
  );

  server.registerTool(
    "get_recipe",
    {
      title: "Get a measured recipe",
      description: "Palette, geometry, type and the motion table for a rebuild, every value read from the source clip's pixels. Paid.",
      inputSchema: { slug: z.string().describe(`one of: ${RECIPES.map((r) => r.slug).join(", ")}`) },
      annotations: ro,
    },
    async ({ slug }) => {
      if (!lim.recipes) return gated("get_recipe", plan, reason);
      const r = RECIPES.find((x) => x.slug === slug);
      return r ? text(r) : text({ error: `No recipe ${slug}`, available: RECIPES.map((x) => x.slug) });
    },
  );

  server.registerTool(
    "list_notes",
    { title: "List design notes", description: "Guidance distilled from measured rebuilds: metal buttons, pressed badges, dark silver tokens, motion for stills, measuring from video. Needs a key.", annotations: ro },
    async () => (plan === "none" ? gated("list_notes", plan, reason) : text(NOTES.map((n) => ({ slug: n.slug, title: n.title, from: n.from })))),
  );

  server.registerTool(
    "get_note",
    { title: "Read a design note", description: "The full note. Needs a key.", inputSchema: { slug: z.string() }, annotations: ro },
    async ({ slug }) => {
      const i = NOTES.findIndex((n) => n.slug === slug);
      if (i < 0) return text({ error: `No note ${slug}`, available: NOTES.map((n) => n.slug) });
      if (i >= lim.notes) return gated("This note", plan, reason);
      return text(NOTES[i]);
    },
  );

  server.registerTool(
    "similar_designs",
    {
      title: "Designs like this one",
      description: "Entries that share traits with a slug: same types first, then category, then kind and tone. Needs a key.",
      inputSchema: { slug: z.string(), limit: z.number().int().min(1).max(24).optional() },
      annotations: ro,
    },
    async ({ slug, limit }) => {
      if (plan === "none") return gated("similar_designs", plan, reason);
      const e = bySlug(slug);
      if (!e) return text({ error: `No entry ${slug}` });
      return text({ of: e.slug, results: similarEntries(e, limit ?? 8).map(publicEntry) });
    },
  );

  server.registerTool(
    "get_brief",
    {
      title: "Rebuild brief",
      description: "How to rebuild an entry: frame, tone, traits, the steps to take, motion presets labeled proposed unless a measured recipe exists, and the notes that apply. Use after see_design. Needs a key.",
      inputSchema: { slug: z.string() },
      annotations: ro,
    },
    async ({ slug }) => {
      if (plan === "none") return gated("get_brief", plan, reason);
      const e = bySlug(slug);
      if (!e) return text({ error: `No entry ${slug}` });
      return text(briefFor(e));
    },
  );

  server.registerTool(
    "see_design",
    {
      title: "See a design",
      description: "The entry's frame as an image, so a vision-capable agent can read layout, type and colour from the pixels, with the record alongside. Paid.",
      inputSchema: { slug: z.string() },
      annotations: ro,
    },
    async ({ slug }) => {
      if (!lim.media) return gated("see_design", plan, reason);
      const e = bySlug(slug);
      if (!e) return text({ error: `No entry ${slug}` });
      if (!e.poster) return text({ error: `No frame for ${slug}` });
      try {
        const { data, mimeType } = await loadFrame(e.poster);
        return { content: [{ type: "image" as const, data, mimeType }, { type: "text" as const, text: JSON.stringify({ ...publicEntry(e), frame: { w: (e.video ?? e.image)?.w, h: (e.video ?? e.image)?.h, from: e.video ? "first frame of the clip" : "the still" } }, null, 2) }] };
      } catch (err) {
        return text({ error: err instanceof Error ? err.message : "frame unavailable" });
      }
    },
  );

  server.registerPrompt(
    "rebuild",
    {
      title: "Rebuild a lookap design",
      description: "A workflow for rebuilding one entry in the current project: look, brief, build, compare.",
      argsSchema: { slug: z.string().describe("the entry slug from search_designs"), where: z.string().optional().describe("the file or component to build it in") },
    },
    ({ slug, where }) => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: [
            `Rebuild the lookap entry \`${slug}\`${where ? ` in ${where}` : " in this project"}.`,
            "1. Call get_design for the record and see_design for the frame. Describe the layout you see in one paragraph before writing code: regions, alignment, type sizes, radii, spacing.",
            "2. Call get_brief. If it says a measured recipe exists, call get_recipe and treat every value in it as fact. Otherwise treat the brief's motion as proposed and say so in a code comment.",
            "3. Build it with this project's stack and tokens. Match proportion and hierarchy first, then colour, then motion.",
            "4. Compare your result with the frame and list what still differs. Fix the three largest differences.",
            "5. Credit the designer in a comment with the source link from the record.",
          ].join("\n"),
        },
      }],
    }),
  );

  server.registerTool(
    "check_media",
    {
      title: "Check whether a clip or still holds an interface",
      description: "Samples a public video or image URL and returns pixel signals, a verdict (interface, rendered, mixed, footage) and a score. Paid.",
      inputSchema: { url: z.string().url() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ url }) => {
      if (!lim.media) return gated("check_media", plan, reason);
      try {
        const set = await sampleVideo(url);
        const h = analyse(set.frames, set.fw, set.fh);
        return text({ kind: set.kind, width: set.width, height: set.height, duration: set.duration, verdict: h.verdict, score: Math.round(h.score * 100), signals: h.signals });
      } catch (e) {
        return text({ error: e instanceof Error ? e.message : "check failed" });
      }
    },
  );

  return server;
}

async function handle(req: Request) {
  const { plan, reason } = await resolvePlan(req);
  const server = build(plan, reason);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    void transport.close();
    void server.close();
  }
}

export async function POST(req: Request) { return handle(req); }
export async function GET(req: Request) { return handle(req); }
export async function DELETE(req: Request) { return handle(req); }
