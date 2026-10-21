import { McpServer, type RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { CATEGORIES, METHOD, NOTES, RECIPES, SECTION_NAMES, briefFor, facets, publicEntry, recipeFor, searchEntries, similarEntries } from "@/lib/registry";
import { compareBuild } from "@/lib/compare";
import { REBUILDS } from "@/lib/rebuilds";
import { QUOTAS, charge, usageFor } from "@/lib/usage";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ENTRIES, bySlug } from "@/lib/data";
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
const gated = (what: string, plan: Plan, reason?: string, needs = "a Pro or Team key") =>
  text({ error: plan === "none" ? `${what} ${REASONS[reason ?? "missing"] ?? REASONS.missing}` : `${what} needs ${needs}. Upgrade at /pricing.` });

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

/* Which plan flag each paid tool needs. On a paid key the tools its plan lacks are hidden from tools/list, so an agent
   only sees what it can call; the instructions name what the next plan adds. A keyless request sees everything, each
   call answering with the pointer to pricing. */
const LOCK: Record<string, keyof (typeof LIMITS)["pro"]> = { get_recipe: "recipes", see_design: "media", check_rebuild: "media", check_media: "media", get_rebuild: "source" };
const NEEDS: Record<string, string> = { recipes: "Pro", media: "Pro", source: "Team" };
const spent = (what: string, u: { used: number; limit: number; resets: string }) => text({ error: `${what} has used its ${u.limit} calls for this month on this account. Resets ${u.resets}. A higher plan at /pricing raises it.`, usage: u });

function build(plan: Plan, reason?: string, keyRef?: string, stale?: boolean) {
  const lim = LIMITS[plan];
  const hidden = plan === "none" ? [] : Object.entries(LOCK).filter(([, need]) => !lim[need]).map(([name, need]) => `${name} (${NEEDS[need]})`);
  const quotas = Object.entries(QUOTAS[plan]).map(([t, n]) => `${t} ${n}/month`);
  const server = new McpServer(
    { name: "lookap", version: "0.3.0" },
    {
      instructions:
        "lookap is a design registry for coding agents: curated interfaces (components, sections, full pages) with media, traits and credits, measured recipes for a few, and design notes. " +
        "Reach for it when asked to design, redesign, polish or rebuild UI, or for inspiration and reference: search_designs to find, see_design to look at the frame or a keyframe, get_brief or get_recipe for how to rebuild, check_rebuild to test your render against the reference, similar_designs to widen, list_notes for guidance. " +
        "A measured recipe is data: frame, elements with boxes, timing, states, keyframes and checks. Build from it as fact, render, call check_rebuild, fix what it reports; that is one pass instead of rounds of feedback. " +
        "Every tool needs a key (Starter $1/mo at /pricing); see_design, get_recipe, check_rebuild and check_media need Pro; get_rebuild, the finished source, needs Team. " +
        (plan === "none" ? "" : `This key is ${plan}. `) +
        (hidden.length ? `Not on this plan, so not listed: ${hidden.join(", ")}; see /pricing. ` : "") +
        (quotas.length ? `Monthly quotas on this account, shared by all its keys: ${quotas.join(", ")}; get_usage shows what is left. ` : "") +
        (stale ? "Key verification used a cached result because the key service was unreachable; limits still apply." : ""),
    },
  );
  const ro = { readOnlyHint: true, idempotentHint: true, openWorldHint: false } as const;
  const handles: Record<string, RegisteredTool> = {};
  const reg: McpServer["registerTool"] = (...a) => { const t = server.registerTool(...a); handles[a[0]] = t; return t; };

  reg(
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

  reg(
    "get_design",
    {
      title: "Get one design",
      description: "Full record for a slug: attribution, category, types, media, and the measured recipe when one exists (paid).",
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

  reg(
    "get_recipe",
    {
      title: "Get a measured recipe",
      description: "The measured recipe as data: palette, geometry and type in prose, then frame size, every element with its box in frame pixels, fill, radius and layer, the timing table in ms with easings, the states, named keyframes for see_design, and checks to test a build against. Also how it was measured (method) and what the first rebuild cost (build). Paid.",
      inputSchema: { slug: z.string().describe(`one of: ${RECIPES.map((r) => r.slug).join(", ")}`) },
      annotations: ro,
    },
    async ({ slug }) => {
      if (!lim.recipes) return gated("get_recipe", plan, reason);
      const r = RECIPES.find((x) => x.slug === slug);
      if (!r) return text({ error: `No recipe ${slug}`, available: RECIPES.map((x) => x.slug) });
      const u = await charge(keyRef, plan, "get_recipe");
      if (u && !u.ok) return spent("get_recipe", u);
      return text(u ? { ...r, usage: u } : r);
    },
  );

  reg(
    "get_rebuild",
    {
      title: "Get the finished rebuild",
      description: "The complete rebuild of an entry as one self-contained HTML file: markup, CSS with every size as calc(N * var(--u)), and the behaviour in plain JavaScript. The guaranteed one-shot: save it, open it, then port it to your stack keeping the numbers. Licensed to the key holder for use inside their own products, not for redistribution as a design asset; the designer's credit stays in the file. Team.",
      inputSchema: { slug: z.string().describe("an entry slug, or a recipe slug") },
      annotations: ro,
    },
    async ({ slug }) => {
      if (!lim.source) return gated("get_rebuild", plan, reason, "a Team key");
      const e = bySlug(slug);
      const recipe = e ? recipeFor(e) : RECIPES.find((r) => r.slug === slug);
      const rb = recipe ? REBUILDS[recipe.slug] : undefined;
      if (!recipe || !rb) return text({ error: `No finished rebuild for ${slug}`, available: Object.keys(REBUILDS) });
      const u = await charge(keyRef, plan, "get_rebuild");
      if (u && !u.ok) return spent("get_rebuild", u);
      const entry = e ?? ENTRIES.find((x) => recipeFor(x)?.slug === recipe.slug);
      const credit = entry ? { designer: entry.authorName, x: entry.x ?? null, source: entry.sourceUrl ?? null } : null;
      const header = `<!-- ${recipe.title}. Rebuilt by lookap (${recipe.build.model}) from ${credit?.designer ?? "the designer"}'s clip${credit?.source ? `: ${credit.source}` : ""}. Licensed to a lookap Team key holder for use in their own products; not for redistribution as a design asset. Issued ${new Date().toISOString().slice(0, 10)}. -->\n`;
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ slug: recipe.slug, title: recipe.title, file: rb.file, bytes: rb.html.length, needs: rb.needs, credit, build: recipe.build, usage: u, how: ["Save the second part as the file named above and open it in a browser; it runs as is.", "To port: keep --u as one source pixel and every calc(N * var(--u)); move the CSS and markup into your component; the script is plain DOM code.", "Then render, screenshot and call check_rebuild to confirm nothing drifted."] }, null, 2) },
          { type: "text" as const, text: header + rb.html },
        ],
      };
    },
  );

  reg(
    "get_method",
    { title: "How lookap measures a clip", description: "The steps behind every measured recipe, so an agent can apply them to a new clip of its own. Needs a key.", annotations: ro },
    async () => (plan === "none" ? gated("get_method", plan, reason) : text({ steps: METHOD })),
  );

  reg(
    "list_notes",
    { title: "List design notes", description: "Guidance distilled from measured rebuilds: metal buttons, pressed badges, dark silver tokens, motion for stills, measuring from video. Needs a key.", annotations: ro },
    async () => (plan === "none" ? gated("list_notes", plan, reason) : text(NOTES.map((n) => ({ slug: n.slug, title: n.title, from: n.from })))),
  );

  reg(
    "get_note",
    { title: "Read a design note", description: "The full note. Needs a key.", inputSchema: { slug: z.string() }, annotations: ro },
    async ({ slug }) => {
      const i = NOTES.findIndex((n) => n.slug === slug);
      if (i < 0) return text({ error: `No note ${slug}`, available: NOTES.map((n) => n.slug) });
      if (i >= lim.notes) return gated("This note", plan, reason);
      return text(NOTES[i]);
    },
  );

  reg(
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

  reg(
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

  reg(
    "see_design",
    {
      title: "See a design",
      description: "The entry's frame as an image, so a vision-capable agent can read layout, type and colour from the pixels, with the record alongside. For entries with a measured recipe, pass `at` with a keyframe name (listed in get_recipe) to see that moment of the clip instead of the first frame. Paid.",
      inputSchema: { slug: z.string(), at: z.string().optional().describe("a keyframe name from the recipe, e.g. inserted or lamp") },
      annotations: ro,
    },
    async ({ slug, at }) => {
      if (!lim.media) return gated("see_design", plan, reason);
      const e = bySlug(slug);
      if (!e) return text({ error: `No entry ${slug}` });
      const recipe = recipeFor(e);
      const kf = at ? recipe?.keyframes.find((k) => k.name === at) : undefined;
      if (at && !kf) return text({ error: `No keyframe ${at} for ${slug}`, available: recipe?.keyframes.map((k) => k.name) ?? [] });
      const src = kf?.src ?? e.poster;
      if (!src) return text({ error: `No frame for ${slug}` });
      const u = await charge(keyRef, plan, "see_design");
      if (u && !u.ok) return spent("see_design", u);
      try {
        const { data, mimeType } = await loadFrame(src);
        const frame = { w: (e.video ?? e.image)?.w, h: (e.video ?? e.image)?.h, at: kf ? `${kf.at} s, ${kf.shows}` : e.video ? "first frame of the clip" : "the still", keyframes: recipe?.keyframes.map((k) => k.name) ?? [] };
        return { content: [{ type: "image" as const, data, mimeType }, { type: "text" as const, text: JSON.stringify({ ...publicEntry(e), frame, usage: u }, null, 2) }] };
      } catch (err) {
        return text({ error: err instanceof Error ? err.message : "frame unavailable" });
      }
    },
  );

  reg(
    "check_rebuild",
    {
      title: "Check a rebuild against the reference",
      description: "Send a screenshot of your build (base64 PNG or JPEG, any size; it is resized to the frame) for an entry with a measured recipe. Returns a 0..100 score, the five elements whose mean colour differs most (reference vs yours), and the three grid regions that differ most with the elements under them. Use it after building, then fix the top differences and call again. Moving elements are only compared at the first keyframe. Paid.",
      inputSchema: {
        slug: z.string(),
        image: z.string().describe("base64 of a PNG or JPEG screenshot of your build, cropped to the recipe's frame (its crop box when it has one)"),
        at: z.string().optional().describe("the keyframe your screenshot shows; default the first (rest state)"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ slug, image, at }) => {
      if (!lim.media) return gated("check_rebuild", plan, reason);
      const e = bySlug(slug);
      const recipe = e ? recipeFor(e) : undefined;
      if (!e || !recipe) return text({ error: `No measured recipe for ${slug}`, available: RECIPES.map((r) => r.slug) });
      if (image.length > 8_000_000) return text({ error: "Image too large: keep the screenshot under 6 MB" });
      const kf = recipe.keyframes.find((k) => k.name === (at ?? recipe.keyframes[0].name));
      if (!kf) return text({ error: `No keyframe ${at}`, available: recipe.keyframes.map((k) => k.name) });
      const u = await charge(keyRef, plan, "check_rebuild");
      if (u && !u.ok) return spent("check_rebuild", u);
      try {
        const buf = Buffer.from(image.replace(/^data:[^,]+,/, ""), "base64");
        const ref = path.join(process.cwd(), "public", kf.src.replace(/^\//, ""));
        const result = await compareBuild(ref, buf, recipe.frame, recipe.elements, kf === recipe.keyframes[0]);
        const checks = recipe.checks.filter((c) => c.at === kf.name).map((c) => c.check);
        return text({ slug, keyframe: kf.name, ...result, checks, usage: u, reading: "delta is the mean per-channel difference over the box, 0 identical; fix the largest elements first, then the regions; the checks are what to verify by eye or by measuring your own render" });
      } catch (err) {
        return text({ error: err instanceof Error ? err.message : "compare failed" });
      }
    },
  );

  server.registerPrompt(
    "rebuild",
    {
      title: "Rebuild a lookap design",
      description: "A workflow for rebuilding one entry in the current project in one pass: recipe, build, render, check, fix.",
      argsSchema: { slug: z.string().describe("the entry slug from search_designs"), where: z.string().optional().describe("the file or component to build it in"), stack: z.string().optional().describe("the stack to build with, e.g. React + Tailwind, Svelte, plain HTML") },
    },
    ({ slug, where, stack }) => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: [
            `Rebuild the lookap entry \`${slug}\`${where ? ` in ${where}` : " in this project"}${stack ? ` with ${stack}` : " with this project's stack"}.`,
            "1. Call get_design for the record and get_brief. If your key is Team, call get_rebuild and port the file to the stack, keeping every number. Otherwise, if the brief says measured, call get_recipe and use it as data: one unit equal to a frame pixel, every element placed from its box, every fill and radius as given, every timing in ms with its easing. Treat nothing in it as a suggestion.",
            "2. If the brief says there is no recipe, call see_design, describe the layout in one paragraph (regions, alignment, type sizes, radii, spacing), and build from that; label the motion as proposed in a comment.",
            "3. Build it. Match proportion and hierarchy first, then colour, then motion. Credit the designer in a comment with the source link from the record.",
            "4. Render your build at the frame size and take a screenshot of the first state. Call check_rebuild with it. Fix the largest differences it reports, then call it again. Stop after three rounds or at a score above 90.",
            "5. For each keyframe in the recipe, call see_design with `at` and compare your build in that state against the checks for it. Report what still differs, in one list, with numbers.",
          ].join("\n"),
        },
      }],
    }),
  );

  reg(
    "check_media",
    {
      title: "Check whether a clip or still holds an interface",
      description: "Samples a public video or image URL and returns pixel signals, a verdict (interface, rendered, mixed, footage) and a score. Paid.",
      inputSchema: { url: z.string().url() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ url }) => {
      if (!lim.media) return gated("check_media", plan, reason);
      const u = await charge(keyRef, plan, "check_media");
      if (u && !u.ok) return spent("check_media", u);
      try {
        const set = await sampleVideo(url);
        const h = analyse(set.frames, set.fw, set.fh);
        return text({ kind: set.kind, width: set.width, height: set.height, duration: set.duration, verdict: h.verdict, score: Math.round(h.score * 100), signals: h.signals, usage: u });
      } catch (e) {
        return text({ error: e instanceof Error ? e.message : "check failed" });
      }
    },
  );

  reg(
    "get_usage",
    { title: "What this key has left", description: "The key's plan, the tools it opens, the account's monthly quotas with what has been used across all its keys, and when they reset. Needs a key.", annotations: ro },
    async () => {
      if (plan === "none") return gated("get_usage", plan, reason);
      const usage = keyRef ? await usageFor(keyRef, plan) : {};
      return text({ plan, perMinute: "rate limited by plan at the key service", quotas: usage, unmetered: Object.keys(LOCK).filter((t) => lim[LOCK[t]] && !QUOTAS[plan][t]).concat(["search_designs", "get_design", "get_brief", "similar_designs", "list_notes", "get_note", "get_method"]), notOnThisPlan: hidden, upgrade: hidden.length ? "/pricing" : null });
    },
  );

  /* a paid key does not see the tools its plan lacks */
  if (plan !== "none") for (const [name, need] of Object.entries(LOCK)) if (!lim[need]) handles[name]?.disable();

  return server;
}

async function handle(req: Request) {
  const { plan, reason, keyRef, stale } = await resolvePlan(req);
  const server = build(plan, reason, keyRef, stale);
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
