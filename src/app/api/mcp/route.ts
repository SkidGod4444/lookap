import { McpServer, type RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { CATEGORIES, METHOD, NOTES, RECIPES, SECTION_NAMES, briefFor, facets, publicEntry, recipeFor, searchEntries, similarEntries } from "@/lib/registry";
import { compareBuild } from "@/lib/compare";
import { REBUILDS, FACTORY, rebuildFor, REBUILD_SLUGS, factoryNotes } from "@/lib/rebuilds";
import { bump } from "@/lib/demand";
import { draftFor } from "@/lib/drafts";
import { BREADTH, DAILY, QUOTAS, charge, chargeDaily, fingerprint, touchEntry, usageFor } from "@/lib/usage";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ENTRIES, bySlug } from "@/lib/data";
import { LIMITS, PLAN_NAME, resolvePlan, type Plan } from "@/lib/keys";
import { sampleVideo } from "@/lib/gate/frames";
import { cachedClip, clipInfo, frameAt, sheetOf, trackEdge } from "@/lib/ffmpeg";
import { clipId } from "@/lib/drafts";
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
  RATE_LIMITED: "is going too fast: more than 30 requests in a minute on this key. Wait a minute and continue; the daily allowance is unchanged.",
  USAGE_EXCEEDED: "has used up this key's credits for the period.",
  NOT_CONFIGURED: "cannot verify keys right now: the server has no Unkey configuration.",
};
const gated = (what: string, plan: Plan, reason?: string, needs = "a Pro or Max key") =>
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
const LOCK: Record<string, keyof (typeof LIMITS)["pro"]> = { get_recipe: "recipes", see_design: "media", look_at: "media", check_rebuild: "media", check_media: "media", get_rebuild: "source" };
/* the notes an agent can read: the hand-written ones, then what the factory learned rebuilding entries */
const allNotes = () => [...NOTES, ...factoryNotes()];
const NEEDS: Record<string, string> = { recipes: "Pro", media: "Pro", source: "Max" };
const spent = (what: string, u: { used: number; limit: number; resets: string }) => text({ error: `${what} has used its ${u.limit} calls for this month on this account. Resets ${u.resets}. A higher plan at /pricing raises it.`, usage: u });
const NEXT: Record<Plan, string> = { none: "", starter: `Pro gets ${DAILY.pro} a day`, pro: `Max gets ${DAILY.team} a day`, team: "you are on the highest plan; the count resets tomorrow" };
const tooWide = (u: { used: number; limit: number; resets: string }) => text({ error: `This account has opened its ${u.limit} entries for today. Keys are for building from entries, not for walking the registry. The count resets ${u.resets}.`, entries: u });
const dayDone = (plan: Plan, u: { used: number; limit: number; resets: string }) => text({ error: `This account has used its ${u.limit} tool calls for today. Resets ${u.resets}. Upgrade at /pricing: ${NEXT[plan]}.`, today: u });

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
        "Every other clip carries a draft measurement in get_brief: phases, moves and palette measured from the clip, boxes as a first pass; its keyframes work with see_design and check_rebuild too. " +
        "look_at is how a clip is measured rather than remembered: its contact sheet, the frame nearest any moment, a crop at 3x beside your own render, exact colours along a line. Use it before deciding a timeline or a material. " +
        "To design something new rather than rebuild, the remix prompt takes two or three entries and a purpose and borrows their principles, proportions and timing, not their pixels; the notes are the transferable part. " +
        "Every tool needs a key (Starter $1/mo at /pricing); see_design, look_at, get_recipe, check_rebuild and check_media need Pro; get_rebuild, the finished source, needs Max. " +
        (plan === "none" ? "" : `This key is ${PLAN_NAME[plan]}. `) +
        (hidden.length ? `Not on this plan, so not listed: ${hidden.join(", ")}; see /pricing. ` : "") +
        (plan === "none" ? "" : `This account may make ${DAILY[plan]} tool calls a day and open ${BREADTH[plan]} distinct entries a day across all its keys; get_usage shows what is left. Recipes, drafts and source files carry a mark naming the account they were issued to. `) +
        (quotas.length ? `Monthly quotas on this account, shared by all its keys: ${quotas.join(", ")}. ` : "") +
        (stale ? "Key verification used a cached result because the key service was unreachable; limits still apply." : ""),
    },
  );
  const ro = { readOnlyHint: true, idempotentHint: true, openWorldHint: false } as const;
  const handles: Record<string, RegisteredTool> = {};
  /* every tool call counts against the day's allowance before it runs; get_usage is free so a spent account can still see why */
  const reg: McpServer["registerTool"] = (...a) => {
    const [name, config, cb] = a as unknown as [string, object, (...h: unknown[]) => unknown];
    const counted = name === "get_usage" || plan === "none" ? cb : async (...h: unknown[]) => { const d = await chargeDaily(keyRef, plan); return d && !d.ok ? dayDone(plan, d) : cb(...h); };
    const t = (server.registerTool as unknown as (n: string, c: object, f: unknown) => RegisteredTool)(name, config, counted);
    handles[name] = t;
    return t;
  };

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
      const br = await touchEntry(keyRef, plan, e.slug);
      if (br && !br.ok) return tooWide(br);
      bump(e.slug, "agent");
      const pub = publicEntry(e);
      const recipe = pub.recipe ? RECIPES.find((r) => r.slug === pub.recipe) : null;
      const rb = rebuildFor(e), fr = FACTORY[e.slug];
      const rebuild = rb
        ? { finished: true, file: lim.source ? "get_rebuild" : "get_rebuild, on a Max key", measured: Boolean(recipe), live: `https://lookap.saidev.codes/feed/${e.slug}`, preview: fr?.preview ? `https://lookap.saidev.codes${fr.preview}` : null, built: rb.build.model }
        : { finished: false, how: recipe ? "get_recipe, then build" : "get_brief and look_at, then build" };
      return text({ ...pub, recipe: recipe ? (lim.recipes ? recipe : { slug: recipe.slug, title: recipe.title, locked: true }) : null, rebuild });
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
      const owner = ENTRIES.find((x) => recipeFor(x)?.slug === r.slug);
      if (owner) { const br = await touchEntry(keyRef, plan, owner.slug); if (br && !br.ok) return tooWide(br); bump(owner.slug, "agent"); }
      const u = await charge(keyRef, plan, "get_recipe");
      if (u && !u.ok) return spent("get_recipe", u);
      return text({ ...r, issued: { to: fingerprint(keyRef), on: new Date().toISOString().slice(0, 10) }, usage: u });
    },
  );

  reg(
    "get_rebuild",
    {
      title: "Get the finished rebuild",
      description: "The complete rebuild of an entry as one self-contained HTML file: markup, CSS with every size as calc(N * var(--u)), and the behaviour in plain JavaScript. The guaranteed one-shot: save it, open it, then port it to your stack keeping the numbers. Licensed to the key holder for use inside their own products, not for redistribution as a design asset; the designer's credit stays in the file. Max.",
      inputSchema: { slug: z.string().describe("an entry slug, or a recipe slug") },
      annotations: ro,
    },
    async ({ slug }) => {
      if (!lim.source) return gated("get_rebuild", plan, reason, "a Max key");
      const e = bySlug(slug);
      const recipe = e ? recipeFor(e) : RECIPES.find((r) => r.slug === slug);
      const entry = e ?? ENTRIES.find((x) => recipe && recipeFor(x)?.slug === recipe.slug);
      const rb = entry ? rebuildFor(entry) : recipe ? { ...REBUILDS[recipe.slug], title: recipe.title, build: recipe.build } : null;
      if (!rb || !rb.html) return text({ error: `No finished rebuild for ${slug}`, available: REBUILD_SLUGS() });
      if (entry) { const br = await touchEntry(keyRef, plan, entry.slug); if (br && !br.ok) return tooWide(br); }
      const u = await charge(keyRef, plan, "get_rebuild");
      if (u && !u.ok) return spent("get_rebuild", u);
      if (entry) bump(entry.slug, "agent");
      const mark = fingerprint(keyRef);
      const credit = entry ? { designer: entry.authorName, x: entry.x ?? null, source: entry.sourceUrl ?? null } : null;
      const header = `<!-- ${rb.title}. Rebuilt by lookap (${rb.build.model}) from ${credit?.designer ?? "the designer"}'s clip${credit?.source ? `: ${credit.source}` : ""}. Licensed to a lookap Max key holder for use in their own products; not for redistribution as a design asset. Issued ${new Date().toISOString().slice(0, 10)} to ${mark}. -->\n`;
      /* the same mark inside the stylesheet, where a stripped comment would not reach */
      const body = rb.html.replace(/(:root|#stage)\s*\{/, `$1 { --lk: "${mark}";`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ slug: entry?.slug ?? recipe?.slug ?? slug, title: rb.title, file: rb.file, bytes: rb.html.length, needs: rb.needs, credit, build: rb.build, measured: Boolean(recipe), issued: { to: mark, on: new Date().toISOString().slice(0, 10) }, usage: u, how: ["Save the second part as the file named above and open it in a browser; it runs as is.", "To port: keep --u as one source pixel and every calc(N * var(--u)); move the CSS and markup into your component; the script is plain DOM code.", "Then render, screenshot and call check_rebuild to confirm nothing drifted."] }, null, 2) },
          { type: "text" as const, text: header + body },
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
    async () => (plan === "none" ? gated("list_notes", plan, reason) : text(allNotes().map((n) => ({ slug: n.slug, title: n.title, from: n.from })))),
  );

  reg(
    "get_note",
    { title: "Read a design note", description: "The full note. Needs a key.", inputSchema: { slug: z.string() }, annotations: ro },
    async ({ slug }) => {
      const notes = allNotes();
      const i = notes.findIndex((n) => n.slug === slug);
      if (i < 0) return text({ error: `No note ${slug}`, available: notes.map((n) => n.slug) });
      if (i >= lim.notes) return gated("This note", plan, reason);
      return text(notes[i]);
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
      const br = await touchEntry(keyRef, plan, e.slug);
      if (br && !br.ok) return tooWide(br);
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
      const br = await touchEntry(keyRef, plan, e.slug);
      if (br && !br.ok) return tooWide(br);
      bump(e.slug, "agent");
      const brief = briefFor(e);
      return text(brief.draft ? { ...brief, issued: { to: fingerprint(keyRef), on: new Date().toISOString().slice(0, 10) } } : brief);
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
      const br = await touchEntry(keyRef, plan, e.slug);
      if (br && !br.ok) return tooWide(br);
      const recipe = recipeFor(e), draft = recipe ? undefined : draftFor(e);
      const frames = recipe?.keyframes ?? draft?.keyframes ?? [];
      const kf = at ? frames.find((k) => k.name === at) : undefined;
      if (at && !kf) return text({ error: `No keyframe ${at} for ${slug}`, available: frames.map((k) => k.name) });
      const src = kf?.src ?? e.poster;
      if (!src) return text({ error: `No frame for ${slug}` });
      const u = await charge(keyRef, plan, "see_design");
      if (u && !u.ok) return spent("see_design", u);
      bump(e.slug, "agent");
      try {
        const { data, mimeType } = await loadFrame(src);
        const frame = { w: (e.video ?? e.image)?.w, h: (e.video ?? e.image)?.h, at: kf ? `${kf.at} s, ${"shows" in kf ? kf.shows : `a hold from ${kf.hold[0]} to ${kf.hold[1]} s`}` : e.video ? "first frame of the clip" : "the still", keyframes: frames.map((k) => k.name), measured: recipe ? "recipe" : draft ? "draft" : "none" };
        return { content: [{ type: "image" as const, data, mimeType }, { type: "text" as const, text: JSON.stringify({ ...publicEntry(e), frame, usage: u }, null, 2) }] };
      } catch (err) {
        return text({ error: err instanceof Error ? err.message : "frame unavailable" });
      }
    },
  );

  reg(
    "look_at",
    {
      title: "Look at a clip the way it was measured",
      description: "Frames and numbers from the clip itself, at full size, not impressions. what=sheet: a contact sheet, the whole clip at 2 fps, or with span [a, b] (seconds, up to 4 s) that stretch at 10 fps in 6 columns, read left to right then down, so you see what moves and in what order before you decide a timeline. what=frame with at (seconds): the clip's frame at that moment. what=zoom with at and box [x, y, w, h] in frame pixels: that crop enlarged, the judge of edges, radii, gradients, shadows and gaps; add image (base64 PNG or JPEG of your own render at that moment, any size) to get your crop beside it. what=colors with at and col (an x) or row (a y) plus from and to: one hex per frame pixel along that line, the true colour of a border, a gradient or a gap. what=track with col or row, span [a, b] (up to 4 s) and cls (red, dark or light): per frame at the clip's own rate, the first and last pixel of that colour along the line, only where it changed, so a motion reads as start, end, distance and shape; track a heading too, since if it moves the page reflows. Clips only. Needs Pro; metered like see_design.",
      inputSchema: {
        slug: z.string(),
        what: z.enum(["sheet", "frame", "zoom", "colors", "track"]),
        at: z.number().optional().describe("seconds into the clip; the nearest stored frame is used and named in the reply"),
        box: z.array(z.number()).length(4).optional().describe("[x, y, w, h] in frame pixels, for zoom"),
        col: z.number().optional().describe("x of the column to read, for colors"),
        row: z.number().optional().describe("y of the row to read, for colors"),
        from: z.number().optional(), to: z.number().optional(),
        image: z.string().optional().describe("base64 of your render at that moment, for zoom: shown beside the clip's crop"),
        span: z.array(z.number()).length(2).optional().describe("[from, to] in seconds, for sheet (10 fps) and track; at most 4 s"),
        cls: z.enum(["red", "dark", "light"]).optional().describe("the colour class to track; default dark"),
      },
      annotations: ro,
    },
    async ({ slug, what, at, box, col, row, from, to, image, span, cls }) => {
      if (!lim.media) return gated("look_at", plan, reason);
      const e = bySlug(slug);
      if (!e) return text({ error: `No entry ${slug}` });
      const draft = draftFor(e);
      if (!draft) return text({ error: `${slug} has no clip to look at` });
      const br = await touchEntry(keyRef, plan, e.slug);
      if (br && !br.ok) return tooWide(br);
      const stored = [...draft.keyframes.map((k) => ({ at: k.at, src: k.src, name: k.name })), ...draft.mids.map((m) => ({ at: m.at, src: m.src, name: `mid-phase` }))].sort((a, b) => a.at - b.at);
      /* the nearest stored frame; a keyframe wins a near tie, since a still is the better reference */
      const nearest = (t: number) => stored.reduce((best, f) => { const d = Math.abs(f.at - t) - Math.abs(best.at - t); return d < -0.1 || (Math.abs(d) <= 0.1 && f.name !== "mid-phase" && best.name === "mid-phase") ? f : best; });
      const file = (src: string) => readFile(path.join(process.cwd(), "public", src.replace(/^\//, "")));
      const W = draft.frame.w, H = draft.frame.h;
      /* the clip itself, from the CDN, kept on this instance; the stored frames stand in if it cannot be read */
      const id = clipId(e)!;
      const clip = e.video ? await cachedClip(id, e.video.src).catch(() => null) : null;
      const spanOk = (s: [number, number]) => s[0] >= 0 && s[1] > s[0] && s[1] - s[0] <= 4 && s[1] <= draft.duration + 0.5;
      if (what === "sheet") {
        const u = await charge(keyRef, plan, "look_at");
        if (u && !u.ok) return spent("look_at", u);
        bump(e.slug, "agent");
        if (span && clip) {
          if (!spanOk(span as [number, number])) return text({ error: `span must be [from, to] within the ${draft.duration}s clip and at most 4 s long` });
          const data = (await sheetOf(clip, span[0], span[1], 10, 6, 450)).toString("base64");
          return { content: [{ type: "image" as const, data, mimeType: "image/jpeg" }, { type: "text" as const, text: JSON.stringify({ slug, sheet: { span, frames: Math.ceil((span[1] - span[0]) * 10), fps: 10, cols: 6, read: `left to right, then down; frame n is at ${span[0]} + (n - 1) / 10 s`, clip: `${W}x${H}, ${draft.duration}s, ${draft.fps} fps` }, phases: draft.phases, usage: u }, null, 2) }] };
        }
        if (!draft.sheet) return text({ error: `No contact sheet for ${slug}` });
        const data = (await file(draft.sheet.src)).toString("base64");
        return { content: [{ type: "image" as const, data, mimeType: "image/jpeg" }, { type: "text" as const, text: JSON.stringify({ slug, sheet: { frames: draft.sheet.frames, fps: draft.sheet.fps, cols: draft.sheet.cols, read: "left to right, then down; frame n is at (n - 1) / 2 s", clip: `${W}x${H}, ${draft.duration}s, ${draft.fps} fps` }, phases: draft.phases, next: "sheet with span [a, b] for any 4 s stretch at 10 fps", usage: u }, null, 2) }] };
      }
      if (what === "track") {
        if (!clip) return text({ error: "the clip could not be read right now; try again" });
        if (col === undefined && row === undefined) return text({ error: "track needs col (x) or row (y) and span [from, to]" });
        if (!span || !spanOk(span as [number, number])) return text({ error: `track needs span [from, to] within the ${draft.duration}s clip and at most 4 s long` });
        const u = await charge(keyRef, plan, "look_at");
        if (u && !u.ok) return spent("look_at", u);
        bump(e.slug, "agent");
        const info = await clipInfo(clip);
        /* the CDN rendition may be smaller than the measured frame: positions go in and come out in frame pixels */
        const k = info.width / W, kb = col !== undefined ? H / info.height : W / info.width;
        const lines = await trackEdge(clip, info, col !== undefined ? "col" : "row", Math.round((col ?? row!) * (col !== undefined ? k : info.height / H)), span[0], span[1], cls ?? "dark");
        const frames = lines.map((l) => ({ at: l.at, first: l.first < 0 ? -1 : Math.round(l.first * kb), last: l.last < 0 ? -1 : Math.round(l.last * kb) }));
        return text({ slug, track: { along: col !== undefined ? `x=${col}` : `y=${row}`, span, cls: cls ?? "dark", fps: info.fps, clip: `${info.width}x${info.height}, read in ${W}x${H} frame pixels`, read: "first and last pixel of that colour along the line per frame, only the frames where they moved; a motion reads as start, end, distance and shape" }, frames, usage: u });
      }
      if (at === undefined) return text({ error: `${what} needs at (seconds)`, stored: stored.map((f) => f.at) });
      const u = await charge(keyRef, plan, "look_at");
      if (u && !u.ok) return spent("look_at", u);
      bump(e.slug, "agent");
      let buf: Buffer, frame: Record<string, unknown>;
      const full = clip ? await frameAt(clip, Math.max(0, Math.min(draft.duration, at))).catch(() => null) : null;
      if (full) { buf = full; frame = { at, from: "the clip, full size" }; }
      else { const f = nearest(at); buf = await file(f.src); frame = { at: f.at, name: f.name, from: "a stored frame, the clip was not readable just now", moments: stored.map((x) => x.at) }; }
      const meta = await sharp(buf).metadata();
      const sx = (meta.width ?? W) / W, sy = (meta.height ?? H) / H;
      const about = { slug, asked: at, frame: { ...frame, size: `${meta.width}x${meta.height}`, source: `${W}x${H}` } };
      if (what === "frame") { const jpg = await sharp(buf).jpeg({ quality: 88 }).toBuffer(); return { content: [{ type: "image" as const, data: jpg.toString("base64"), mimeType: "image/jpeg" }, { type: "text" as const, text: JSON.stringify({ ...about, usage: u }, null, 2) }] }; }
      if (what === "zoom") {
        if (!box) return text({ error: "zoom needs box [x, y, w, h] in frame pixels" });
        const [x, y, w, h] = box.map((n) => Math.max(0, Math.round(n)));
        if (w < 4 || h < 4 || x + w > W || y + h > H) return text({ error: `box must sit inside the ${W}x${H} frame` });
        const S = Math.max(1, Math.min(4, Math.floor(900 / w)));
        const crop = async (img: Buffer, fx: number, fy: number) => sharp(img).extract({ left: Math.round(x * fx), top: Math.round(y * fy), width: Math.max(1, Math.round(w * fx)), height: Math.max(1, Math.round(h * fy)) }).resize(w * S, h * S, { kernel: "nearest" }).png().toBuffer();
        const panels = [await crop(buf, sx, sy)];
        if (image) {
          const mine = await sharp(Buffer.from(image, "base64")).resize(W, H, { fit: "fill" }).png().toBuffer();
          panels.push(await crop(mine, 1, 1));
        }
        const out = await sharp({ create: { width: w * S * panels.length + 12 * (panels.length - 1), height: h * S, channels: 3, background: "#ff3b30" } })
          .composite(panels.map((pn, i) => ({ input: pn, left: i * (w * S + 12), top: 0 }))).png().toBuffer();
        return { content: [{ type: "image" as const, data: out.toString("base64"), mimeType: "image/png" }, { type: "text" as const, text: JSON.stringify({ ...about, box: [x, y, w, h], scale: S, panels: image ? "the clip on the left, your render on the right" : "the clip", usage: u }, null, 2) }] };
      }
      /* colors */
      if (col === undefined && row === undefined) return text({ error: "colors needs col (x) or row (y), with from and to" });
      const along = col !== undefined ? "y" : "x";
      const a = Math.max(0, Math.round(from ?? 0)), b = Math.min(along === "y" ? H - 1 : W - 1, Math.round(to ?? (along === "y" ? H - 1 : W - 1)));
      if (b - a > 400) return text({ error: "keep the line under 400 frame pixels" });
      const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
      const px = (ix: number, iy: number) => { const o = (Math.min(info.height - 1, iy) * info.width + Math.min(info.width - 1, ix)) * info.channels; return "#" + [0, 1, 2].map((k) => data[o + k].toString(16).padStart(2, "0")).join(""); };
      const line: string[] = [];
      for (let i = a; i <= b; i++) line.push(`${i}:${along === "y" ? px(Math.round(col! * sx), Math.round(i * sy)) : px(Math.round(i * sx), Math.round(row! * sy))}`);
      return text({ ...about, line: along === "y" ? `x=${col}, y ${a} to ${b}` : `y=${row}, x ${a} to ${b}`, colors: line.join(" "), note: full ? "one hex per frame pixel, read from the clip at full size" : "one hex per frame pixel, read from a stored frame smaller than the source, so neighbours repeat", usage: u });
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
      const recipe = e ? recipeFor(e) : undefined, draft = e && !recipe ? draftFor(e) : undefined;
      if (!e || (!recipe && !draft)) return text({ error: `No measurement for ${slug}`, measured: RECIPES.map((r) => r.slug) });
      const br = await touchEntry(keyRef, plan, e.slug);
      if (br && !br.ok) return tooWide(br);
      if (image.length > 8_000_000) return text({ error: "Image too large: keep the screenshot under 6 MB" });
      const frames = recipe?.keyframes ?? draft!.keyframes;
      const kf = frames.find((k) => k.name === (at ?? frames[0].name));
      if (!kf) return text({ error: `No keyframe ${at}`, available: frames.map((k) => k.name) });
      const frame = recipe?.frame ?? draft!.frame;
      const elements = recipe?.elements ?? draft!.elements.map((d, i) => ({ name: `draft ${i + 1} ${d.fill}`, box: d.box, fill: d.fill }));
      const u = await charge(keyRef, plan, "check_rebuild");
      if (u && !u.ok) return spent("check_rebuild", u);
      bump(e.slug, "agent");
      try {
        const buf = Buffer.from(image.replace(/^data:[^,]+,/, ""), "base64");
        const ref = path.join(process.cwd(), "public", kf.src.replace(/^\//, ""));
        const result = await compareBuild(ref, buf, frame, elements, kf === frames[0]);
        const checks = recipe ? recipe.checks.filter((c) => c.at === kf.name).map((c) => c.check) : ["draft: the regions are reliable; the element rows use first-pass boxes, so weigh them by eye"];
        return text({ slug, keyframe: kf.name, measured: recipe ? "recipe" : "draft", ...result, checks, usage: u, reading: "delta is the mean per-channel difference over the box, 0 identical; fix the largest elements first, then the regions; the checks are what to verify by eye or by measuring your own render" });
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
            "1. Call get_design for the record and get_brief. If your key is Max, call get_rebuild and port the file to the stack, keeping every number. Otherwise, if the brief says measured, call get_recipe and use it as data: one unit equal to a frame pixel, every element placed from its box, every fill and radius as given, every timing in ms with its easing. Treat nothing in it as a suggestion.",
            "2. If the brief says there is no recipe, call look_at with what=sheet for the whole clip, then see_design for each keyframe. Write the timeline as events with numbers (what, from when to when, how far) from the brief's phases and moves, and the layout in one paragraph (regions, alignment, type sizes, radii, spacing). Zoom the edge of every surface with look_at what=zoom before drawing it: edges, gaps and gradients are where rebuilds go wrong.",
            "3. Build it. Match proportion and hierarchy first, then colour, then motion. Credit the designer in a comment with the source link from the record.",
            "4. Render your build at the frame size and take a screenshot of the first state. Call check_rebuild with it, then look_at what=zoom with your screenshot on the worst region it names. Fix what the crop shows, then check again. Stop after three rounds or at a score above 90.",
            "5. For each keyframe in the recipe, call see_design with `at` and compare your build in that state against the checks for it. Report what still differs, in one list, with numbers.",
          ].join("\n"),
        },
      }],
    }),
  );

  server.registerPrompt(
    "remix",
    {
      title: "Design something new from lookap references",
      description: "A workflow for making a new component or section in the spirit of two or three entries: read what makes each work, borrow principles, proportions and timing, never pixels or copy, build for a real purpose, then judge it by the references' own standard.",
      argsSchema: { slugs: z.string().describe("two or three entry slugs from search_designs, comma-separated"), purpose: z.string().describe("what to make and for whom, e.g. a pricing section for a developer tool"), stack: z.string().optional().describe("the stack to build with") },
    },
    ({ slugs, purpose, stack }) => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: [
            `Design ${purpose}${stack ? ` with ${stack}` : " with this project's stack"}, in the spirit of the lookap entries ${slugs.split(",").map((x) => `\`${x.trim()}\``).join(", ")}. New work, not a rebuild.`,
            "1. For each entry call get_design and get_brief, then see_design; for a clip, look_at with what=sheet. Write one paragraph per entry naming what makes it work in numbers: the spacing rhythm, the type scale, how its surfaces are lit (rims, shadows, inner highlights), the one motion and its timing. Adjectives are not findings.",
            "2. Call list_notes and get_note for the notes whose titles touch the purpose or the references. The notes are the transferable part.",
            "3. Decide what to borrow: a proportion, a material, a timing, a way of answering the pointer. Not a layout, not a palette wholesale, not the copy. Name the one element that will be the memorable thing and keep everything else quiet.",
            "4. Build for the purpose with real content. No pixel, texture or line of copy from the references. Credit them in a comment as inspiration, with the source links from their records.",
            "5. Render it and judge it the way each reference's designer would: does it hold their standard of spacing, material and motion? Fix the three largest gaps. End with one list: what was borrowed, from which entry, and what is new.",
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
      const usage = keyRef ? await usageFor(keyRef, plan) : { today: { used: 0, limit: DAILY[plan], resets: "" }, entries: { used: 0, limit: BREADTH[plan], resets: "" }, month: {} };
      return text({ plan: PLAN_NAME[plan], today: usage.today, entriesToday: usage.entries, quotas: usage.month, unmetered: Object.keys(LOCK).filter((t) => lim[LOCK[t]] && !QUOTAS[plan][t]).concat(["search_designs", "get_design", "get_brief", "similar_designs", "list_notes", "get_note", "get_method"]), notOnThisPlan: hidden, upgrade: hidden.length ? "/pricing" : null });
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

/* a look_at on a cold instance fetches the clip and runs ffmpeg; give it room */
export const maxDuration = 60;

export async function POST(req: Request) { return handle(req); }
export async function GET(req: Request) { return handle(req); }
export async function DELETE(req: Request) { return handle(req); }
