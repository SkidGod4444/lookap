import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { CATEGORIES, NOTES, RECIPES, SECTION_NAMES, publicEntry, searchEntries } from "@/lib/registry";
import { bySlug } from "@/lib/data";
import { LIMITS, keyFromRequest, planForKey, type Plan } from "@/lib/keys";
import { sampleVideo } from "@/lib/gate/frames";
import { analyse } from "@/lib/gate/heuristics";

/* lookap MCP: the design registry for agents. Stateless Streamable HTTP, one server per request.
   Add it to Claude Code with:
     claude mcp add --transport http lookap https://<host>/api/mcp --header "Authorization: Bearer <key>"
   Without a key every tool answers with a pointer to pricing. */

const text = (v: unknown) => ({ content: [{ type: "text" as const, text: typeof v === "string" ? v : JSON.stringify(v, null, 2) }] });
const gated = (what: string, plan: Plan) => text({ error: plan === "none" ? `${what} needs a key. Starter is $1 a month at /pricing. Send it as Authorization: Bearer <key>.` : `${what} needs a Pro or Team key. Upgrade at /pricing.` });

function build(plan: Plan) {
  const lim = LIMITS[plan];
  const server = new McpServer({ name: "lookap", version: "0.1.0" });

  server.registerTool(
    "search_designs",
    {
      title: "Search the registry",
      description: "Find curated interfaces by words, category or kind. Returns slugs to pass to get_design. Needs a key.",
      inputSchema: { query: z.string().describe("words to match in title, category, types or description"), category: z.string().optional(), kind: z.enum(["feed", "website", "launch", "og"]).optional(), limit: z.number().int().min(1).max(100).optional() },
    },
    async ({ query, category, kind, limit }) => {
      if (plan === "none") return gated("search_designs", plan);
      const rows = searchEntries(query, { category, kind, limit: Math.min(limit ?? lim.search, lim.search) }).map(publicEntry);
      return text({ plan, count: rows.length, results: rows, categories: CATEGORIES, sections: SECTION_NAMES });
    },
  );

  server.registerTool(
    "get_design",
    {
      title: "Get one design",
      description: "Full record for a slug: attribution, category, types, demo clip when lookap owns one, and the measured recipe when one exists (paid).",
      inputSchema: { slug: z.string() },
    },
    async ({ slug }) => {
      if (plan === "none") return gated("get_design", plan);
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
    },
    async ({ slug }) => {
      if (!lim.recipes) return gated("get_recipe", plan);
      const r = RECIPES.find((x) => x.slug === slug);
      return r ? text(r) : text({ error: `No recipe ${slug}`, available: RECIPES.map((x) => x.slug) });
    },
  );

  server.registerTool(
    "list_notes",
    { title: "List design notes", description: "Guidance distilled from measured rebuilds: metal buttons, pressed badges, dark silver tokens, motion for stills, measuring from video. Needs a key." },
    async () => (plan === "none" ? gated("list_notes", plan) : text(NOTES.map((n) => ({ slug: n.slug, title: n.title, from: n.from })))),
  );

  server.registerTool(
    "get_note",
    { title: "Read a design note", description: "The full note. Needs a key.", inputSchema: { slug: z.string() } },
    async ({ slug }) => {
      const i = NOTES.findIndex((n) => n.slug === slug);
      if (i < 0) return text({ error: `No note ${slug}`, available: NOTES.map((n) => n.slug) });
      if (i >= lim.notes) return gated("This note", plan);
      return text(NOTES[i]);
    },
  );

  server.registerTool(
    "check_media",
    {
      title: "Check whether a clip or still holds an interface",
      description: "Samples a public video or image URL and returns pixel signals, a verdict (interface, rendered, mixed, footage) and a score. Paid.",
      inputSchema: { url: z.string().url() },
    },
    async ({ url }) => {
      if (!lim.media) return gated("check_media", plan);
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
  const plan = planForKey(keyFromRequest(req));
  const server = build(plan);
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
