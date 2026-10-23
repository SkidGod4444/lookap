import { McpServer, type RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { CATEGORIES, METHOD, NOTES, RECIPES, SECTION_NAMES, briefFor, facets, publicEntry, recipeFor, searchEntries, similarEntries } from "@/lib/registry";
import { changedArea, compareBuild, contentBox, diffView, motionRead, raw } from "@/lib/compare";
import { IMAGERY_RULE, SAMPLING_RULE, rubricFor } from "@/lib/rubrics";
import { JUDGE_DELEGATION, JUDGE_INSTRUCTION, JUDGE_SCHEMA, judgeTile, packSheets } from "@/lib/judge";
import { kv, dbReady } from "@/lib/db";
import { randomBytes } from "node:crypto";
import { REBUILDS, FACTORY, rebuildFor, REBUILD_SLUGS, factoryNotes } from "@/lib/rebuilds";
import { bump, queuePosition } from "@/lib/demand";
import { draftFor } from "@/lib/drafts";
import { BREADTH, DAILY, QUOTAS, charge, chargeDaily, fingerprint, touchEntry, usageFor } from "@/lib/usage";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";
import { ENTRIES, bySlug, type Entry } from "@/lib/data";
import { LIMITS, PLAN_NAME, resolvePlan, type Plan } from "@/lib/keys";
import { sampleVideo } from "@/lib/gate/frames";
import { cachedClip, cachedUrl, clipInfo, frameAt, measureClip, sheetOf, trackEdge } from "@/lib/ffmpeg";
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
  RATE_LIMITED: "is going too fast: more than 60 requests in a minute on this key, errors included. Pause 20 seconds, then continue at a steadier pace; retrying at once keeps the brake on. The daily allowance is unchanged.",
  USAGE_EXCEEDED: "has used up this key's credits for the period.",
  NOT_CONFIGURED: "cannot verify keys right now: the server has no Unkey configuration.",
};
/* an entry by its slug, or by its recipe's slug: both appear in replies (list_notes names recipes), so both resolve */
const entryFor = (slug: string) => bySlug(slug) ?? ENTRIES.find((x) => recipeFor(x)?.slug === slug);

const gated = (what: string, plan: Plan, reason?: string, needs = "a Pro or Max key") => {
  const flag = LOCK_OF[what];
  return text({ error: plan === "none" ? `${what} ${REASONS[reason ?? "missing"] ?? REASONS.missing}` : `${what} needs ${needs}. Upgrade at /pricing.`, ...(plan !== "none" && flag && BETTER[flag] ? { whatItAdds: BETTER[flag] } : {}) });
};

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
const LOCK: Record<string, keyof (typeof LIMITS)["pro"]> = { get_recipe: "recipes", see_design: "frames", look_at: "media", measure: "media", check_rebuild: "media", judge_rebuild: "media", check_media: "media", get_rebuild: "source", request_rebuild: "source" };
/* the notes an agent can read: the hand-written ones, then what the factory learned rebuilding entries */
const allNotes = () => [...NOTES, ...factoryNotes()];
const NEEDS: Record<string, string> = { recipes: "Pro", frames: "Starter", media: "Pro", source: "Max" };
const LOCK_OF: Record<string, string> = LOCK;
/* what the next plan does for the rebuild, said where an agent meets the limit */
const BETTER: Record<string, string> = {
  recipes: "Pro gives the measured recipe as data: every element's box, fill and timing, so the build is placed rather than guessed",
  media: "Pro measures and proves the rebuild: what moves (look_at diff, track), exact colours and crops, a pixel and motion score per moment, and the checklist judged on crop pairs, so the agent fixes what is wrong instead of guessing",
  source: "Max hands over the finished rebuild, already judged against the clip, to port instead of build, and lets the agent ask for one that does not exist yet",
  frames: "Starter shows the frames themselves",
};
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
        "look_at is how a catalogue clip is measured rather than remembered: its contact sheet, the frame at any moment, what changed between two moments, a crop beside your own render, exact colours along a line, an edge tracked per frame. Where an entry carries a rubric (get_brief says so) the checklist is the goal: check_rebuild with several screenshots reads pixels and motion, and judge_rebuild composes the evidence for a judge you run on your own model; a rebuild is done when every criterion passes, not at a score. For a clip or still that is not in the catalogue (the user's own video, a URL), measure does the same from that file: a draft measurement first, then the same reads, and a check of your render against any moment. look_at, see_design and check_rebuild work on entries only. " +
        "To design something new rather than rebuild, the remix prompt takes two or three entries and a purpose and borrows their principles, proportions and timing, not their pixels; the notes are the transferable part. " +
        "Every tool needs a key. Starter ($1/mo) builds from sight: search, get_design, get_brief with the entry's checklist, the notes, and see_design for the frames. Pro measures and proves: look_at, measure, get_recipe, check_rebuild, judge_rebuild, check_media. Max starts from the finished rebuild with get_rebuild and asks for missing ones with request_rebuild. See /pricing. " +
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
      const e = entryFor(slug);
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
      const d = draftFor(e);
      const frame = recipe ? { ...recipe.frame, from: "the measured recipe: build at this size" } : d ? { w: d.frame.w, h: d.frame.h, from: "the draft measurement: build at this size; media.w and media.h are the CDN rendition of the clip, smaller" } : null;
      return text({ ...pub, frame, recipe: recipe ? (lim.recipes ? recipe : { slug: recipe.slug, title: recipe.title, locked: true }) : null, rebuild });
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
      const r = RECIPES.find((x) => x.slug === slug) ?? (() => { const e = bySlug(slug); return e ? recipeFor(e) : undefined; })();
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
      const e = entryFor(slug);
      const recipe = e ? recipeFor(e) : RECIPES.find((r) => r.slug === slug);
      const entry = e ?? ENTRIES.find((x) => recipe && recipeFor(x)?.slug === recipe.slug);
      const rb = entry ? rebuildFor(entry) : recipe ? { ...REBUILDS[recipe.slug], title: recipe.title, build: recipe.build } : null;
      if (!rb || !rb.html) {
        if (entry) { await bump(entry.slug, "request"); const pos = await queuePosition(entry.slug); return text({ error: `No finished rebuild for ${slug} yet`, requested: true, queue: pos ? `asked for on your behalf: number ${pos} in the rebuild queue` : "asked for on your behalf", meanwhile: "get_brief carries the checklist; look_at, check_rebuild and judge_rebuild take you there", available: REBUILD_SLUGS() }); }
        return text({ error: `No finished rebuild for ${slug}`, available: REBUILD_SLUGS() });
      }
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
    "request_rebuild",
    {
      title: "Ask for a finished rebuild",
      description: "Puts an entry without a finished rebuild at the front of lookap's rebuild queue, ahead of everything asked for by saves and reads; you get its place in the queue. When it ships, get_rebuild returns it. Max.",
      inputSchema: { slug: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ slug }) => {
      if (!lim.source) return gated("request_rebuild", plan, reason, "a Max key");
      const e = entryFor(slug);
      if (!e) return text({ error: `No entry ${slug}` });
      if (rebuildFor(e)) return text({ slug: e.slug, finished: true, next: "get_rebuild returns it now" });
      const u = await charge(keyRef, plan, "request_rebuild");
      if (u && !u.ok) return spent("request_rebuild", u);
      await bump(e.slug, "request");
      const pos = await queuePosition(e.slug);
      return text({ slug: e.slug, requested: true, queue: pos, read: pos ? `number ${pos} in the rebuild queue` : "in the rebuild queue", meanwhile: "get_brief carries the checklist; look_at, check_rebuild and judge_rebuild take you there", usage: u });
    },
  );

  reg(
    "get_method",
    { title: "How lookap measures a clip", description: "The steps behind every measured recipe, so an agent can apply them to a new clip of its own. Needs a key.", annotations: ro },
    async () => (plan === "none" ? gated("get_method", plan, reason) : text({ steps: METHOD })),
  );

  reg(
    "list_notes",
    { title: "List design notes", description: "Every design note in full, one call: guidance distilled from the measured and factory rebuilds (materials, motion, how clips are read), each with the entries it came from. Notes past the plan's allowance come as titles only. Needs a key.", annotations: ro },
    async () => (plan === "none" ? gated("list_notes", plan, reason) : text(allNotes().map((n, i) => (i < lim.notes ? n : { slug: n.slug, title: n.title, from: n.from, locked: true })))),
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
      const e = entryFor(slug);
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
      const e = entryFor(slug);
      if (!e) return text({ error: `No entry ${slug}` });
      const br = await touchEntry(keyRef, plan, e.slug);
      if (br && !br.ok) return tooWide(br);
      bump(e.slug, "agent");
      const brief = briefFor(e);
      const rb = rubricFor(e);
      const rubric = rb
        ? { written: rb.written, summary: rb.summary, criteria: rb.criteria, elements: rb.elements, moves: rb.moves,
            moments: [...new Set(rb.criteria.flatMap((c) => [c.at, ...(c.then == null ? [] : [c.then])]))].sort((a, b) => a - b),
            imagery: rb.imagery.map((m) => ({ ...m, rule: m.class === "photo" && rb.licensed ? IMAGERY_RULE.licensed : IMAGERY_RULE[m.class] })),
            how: "every criterion must be true of your file; the judge looks at a crop of the clip beside the same crop of your render at the moment named (two for motion). Render at the moments listed, call check_rebuild with those screenshots for pixels and motion, then judge_rebuild for the checklist. Done means every criterion passes and your render moves where the clip moves." }
        : null;
      const policy = { imagery: IMAGERY_RULE, sampling: SAMPLING_RULE, rubric: rb ? "this entry has a rubric: see rubric" : "no rubric yet for this entry: judge by the crops (look_at what=zoom) and the brief's moments; the sampling and imagery rules still apply" };
      const fr = rebuildFor(e);
      const yourPlan = plan === "starter"
        ? { plan: "Starter", build: "build from sight: see_design at each moment in rubric.moments, then check every criterion by eye against your render", next: BETTER.media }
        : plan === "pro"
          ? { plan: "Pro", build: "measure with look_at, render at the moments, check_rebuild with an upload token, then judge_rebuild until every criterion passes", next: fr ? `a finished rebuild of this entry exists: ${BETTER.source}` : BETTER.source }
          : { plan: "Max", build: fr ? "get_rebuild hands you the finished file, judged against the clip: port it, keep the numbers, then check_rebuild your port" : "no finished rebuild yet: request_rebuild puts this entry at the front of the queue; meanwhile measure and judge as on Pro" };
      return text(brief.draft ? { ...brief, rubric, policy, yourPlan, issued: { to: fingerprint(keyRef), on: new Date().toISOString().slice(0, 10) } } : { ...brief, rubric, policy, yourPlan });
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
      if (!lim.frames) return gated("see_design", plan, reason, "a key");
      const e = entryFor(slug);
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
      description: "Frames and numbers from the clip itself, at full size, not impressions. what=sheet: a contact sheet, the whole clip at 2 fps, or with span [a, b] (seconds, up to 4 s) that stretch at 10 fps in 6 columns, read left to right then down, so you see what moves and in what order before you decide a timeline. what=frame with at (seconds): the clip's frame at that moment. what=diff with span [a, b]: the clip at a, at b, and what changed between them in white, cropped to the content, with the share of the frame that changed and where: which thing moves and which only has something pass over it, read before you decide a timeline. what=zoom with at and box [x, y, w, h] in frame pixels: that crop enlarged, the judge of edges, radii, gradients, shadows and gaps; add image (base64 PNG or JPEG of your own render at that moment, any size) to get your crop beside it. what=colors with at and col (an x) or row (a y) plus from and to: one hex per frame pixel along that line, the true colour of a border, a gradient or a gap. what=track with col or row, span [a, b] (up to 4 s) and cls (red, dark or light): per frame at the clip's own rate, the first and last pixel of that colour along the line, only where it changed, so a motion reads as start, end, distance and shape; track a heading too, since if it moves the page reflows. Clips only. Needs Pro; metered like see_design.",
      inputSchema: {
        slug: z.string(),
        what: z.enum(["sheet", "frame", "diff", "zoom", "colors", "track"]),
        at: z.union([z.number(), z.string()]).optional().describe("seconds into the clip, or a keyframe name from the brief such as kf2"),
        box: z.array(z.number()).length(4).optional().describe("[x, y, w, h] in frame pixels, for zoom"),
        col: z.number().optional().describe("x of the column to read, for colors"),
        row: z.number().optional().describe("y of the row to read, for colors"),
        from: z.number().optional(), to: z.number().optional(),
        image: z.string().optional().describe("base64 of your render at that moment, for zoom: shown beside the clip's crop"),
        span: z.array(z.number()).length(2).optional().describe("[from, to] in seconds, for sheet (10 fps) and track, at most 4 s; for diff, the two moments to compare"),
        cls: z.enum(["red", "dark", "light"]).optional().describe("the colour class to track; default dark"),
      },
      annotations: ro,
    },
    async ({ slug, what, at: atArg, box, col, row, from, to, image, span, cls }) => {
      let at: number | string | undefined = atArg;
      if (!lim.media) return gated("look_at", plan, reason);
      const e = entryFor(slug);
      if (!e) return text({ error: `No entry ${slug}` });
      const draft = draftFor(e);
      if (!draft) return text({ error: `${slug} has no clip to look at` });
      if (typeof at === "string") { const named = [...draft.keyframes, ...(recipeFor(e)?.keyframes ?? [])].find((k) => k.name === at); if (!named) return text({ error: `No keyframe ${at}`, available: draft.keyframes.map((k) => k.name) }); at = named.at; }
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
      if (what === "diff") {
        if (!clip) return text({ error: "the clip could not be read right now; try again" });
        if (!span || span[0] < 0 || span[1] < 0 || span[0] > draft.duration + 0.5 || span[1] > draft.duration + 0.5 || span[0] === span[1]) return text({ error: `diff needs span [a, b]: two different moments within the ${draft.duration}s clip` });
        const u = await charge(keyRef, plan, "look_at");
        if (u && !u.ok) return spent("look_at", u);
        bump(e.slug, "agent");
        const [fa, fb] = await Promise.all(span.map((t) => frameAt(clip, Math.max(0, Math.min(draft.duration, t)))));
        const v = await diffView(fa, fb, draft.background);
        const k = W / v.size.w;
        const inFrame = (b: number[] | null) => b && b.map((n) => Math.round(n * k));
        return { content: [{ type: "image" as const, data: v.image.toString("base64"), mimeType: "image/jpeg" }, { type: "text" as const, text: JSON.stringify({ slug, diff: { span, panels: `the clip at ${span[0]}s, at ${span[1]}s, and what changed (white = changed), cropped to frame box ${JSON.stringify(inFrame(v.crop))} at ${v.scale.toFixed(2)}x`, changed: `${v.changed}% of the frame`, changedBox: inFrame(v.changedBox), read: "the white shapes are the things that move; a region white only along an edge had something pass over it; a thing that stays black does not move even if the draft's motion rows say it does" }, usage: u }, null, 2) }] };
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
        return { content: [{ type: "image" as const, data: out.toString("base64"), mimeType: "image/png" }, { type: "text" as const, text: JSON.stringify({ ...about, box: [x, y, w, h], scale: S, panels: image ? "the clip on the left, your render on the right" : "the clip", mapping: `box is in ${W}x${H} frame pixels; the clip is read at ${meta.width}x${meta.height} and scaled to match`, usage: u }, null, 2) }] };
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
    "measure",
    {
      title: "Measure a clip of your own",
      description: "The same measuring as look_at, for a clip or still that is not in the catalogue: a public http(s) URL to an mp4, webm, gif, png, jpg or webp, up to 80 MB. what=draft (the default): frame size, fps, duration, the phases where something moves (read at 10 fps), the holds between them, the moments worth checking, the first frame's palette and background. Then on the same URL: what=sheet (the whole clip at 2 fps, or span=[a, b] up to 4 s at 10 fps), what=frame with at, what=zoom with at and box=[x, y, w, h] in the clip's own pixels plus image (your render) to see the two crops side by side, what=colors with at and col or row plus from and to, what=track with col or row, span and cls, and what=check with at and image: your render scored against that moment of the clip, with the regions that differ most. The file is fetched once and kept while this server instance is warm, so measure first, then read. Needs Pro; metered as Looks.",
      inputSchema: {
        url: z.string().describe("public http(s) address of the clip or still"),
        what: z.enum(["draft", "sheet", "frame", "zoom", "colors", "track", "check"]).optional(),
        at: z.number().optional().describe("seconds into the clip"),
        box: z.array(z.number()).length(4).optional().describe("[x, y, w, h] in the clip's pixels, for zoom"),
        col: z.number().optional(), row: z.number().optional(), from: z.number().optional(), to: z.number().optional(),
        image: z.string().optional().describe("base64 PNG or JPEG of your render, for zoom (beside the clip's crop) and check (scored against the frame)"),
        span: z.array(z.number()).length(2).optional().describe("[from, to] in seconds, for sheet (10 fps) and track, at most 4 s; for diff, the two moments to compare"),
        cls: z.enum(["red", "dark", "light"]).optional(),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    async ({ url, what = "draft", at, box, col, row, from, to, image, span, cls }) => {
      if (!lim.media) return gated("measure", plan, reason);
      let file: string;
      try { file = (await cachedUrl(url)).file; } catch (err) { return text({ error: err instanceof Error ? err.message : "could not fetch that address" }); }
      const u = await charge(keyRef, plan, "look_at");
      if (u && !u.ok) return spent("measure", u);
      let m: Awaited<ReturnType<typeof measureClip>>;
      try { m = await measureClip(file); } catch (err) { return text({ error: err instanceof Error ? err.message : "could not read that file as a clip or image" }); }
      const W = m.frame.w, H = m.frame.h;
      const spanOk = (sp: [number, number]) => sp[0] >= 0 && sp[1] > sp[0] && sp[1] - sp[0] <= 4 && sp[1] <= m.duration + 0.5;
      if (what === "draft") return text({ url, ...m, next: m.still ? "frame, zoom and colors read the still (at 0); check scores your render against it" : "sheet for the whole clip, then frame and zoom at the moments listed; track an edge through a phase; check your render against any moment", usage: u });
      if (m.still && (what === "sheet" || what === "track")) return text({ error: `${what} needs a clip; this is a still` });
      if (what === "sheet") {
        const sp = (span ?? [0, Math.min(m.duration, 4)]) as [number, number];
        if (span && !spanOk(sp)) return text({ error: `span must be [from, to] within the ${m.duration}s clip and at most 4 s long` });
        const whole = !span;
        const data = (whole ? await sheetOf(file, 0, Math.min(m.duration, 24), 2, 6, 240) : await sheetOf(file, sp[0], sp[1], 10, 6, 450)).toString("base64");
        return { content: [{ type: "image" as const, data, mimeType: "image/jpeg" }, { type: "text" as const, text: JSON.stringify({ url, sheet: whole ? { frames: Math.ceil(Math.min(m.duration, 24) * 2), fps: 2, cols: 6, read: "left to right, then down; frame n is at (n - 1) / 2 s; the first 24 s" } : { span: sp, fps: 10, cols: 6, read: `left to right, then down; frame n is at ${sp[0]} + (n - 1) / 10 s` }, clip: `${W}x${H}, ${m.duration}s, ${m.fps} fps`, phases: m.phases, usage: u }, null, 2) }] };
      }
      if (what === "track") {
        if (col === undefined && row === undefined) return text({ error: "track needs col (x) or row (y) and span [from, to]" });
        if (!span || !spanOk(span as [number, number])) return text({ error: `track needs span [from, to] within the ${m.duration}s clip and at most 4 s long` });
        const info = await clipInfo(file);
        const lines = await trackEdge(file, info, col !== undefined ? "col" : "row", col ?? row!, span[0], span[1], cls ?? "dark");
        return text({ url, track: { along: col !== undefined ? `x=${col}` : `y=${row}`, span, cls: cls ?? "dark", fps: info.fps, read: "first and last pixel of that colour along the line per frame, only the frames where they moved" }, frames: lines, usage: u });
      }
      const t = Math.max(0, Math.min(m.duration, at ?? 0));
      let buf: Buffer;
      try { buf = m.still ? await sharp(await readFile(file)).png().toBuffer() : await frameAt(file, t); } catch { return text({ error: "could not read a frame at that time" }); }
      const about = { url, at: t, frame: `${W}x${H}` };
      if (what === "frame") { const jpg = await sharp(buf).jpeg({ quality: 88 }).toBuffer(); return { content: [{ type: "image" as const, data: jpg.toString("base64"), mimeType: "image/jpeg" }, { type: "text" as const, text: JSON.stringify({ ...about, moments: m.moments, usage: u }, null, 2) }] }; }
      if (what === "check") {
        if (!image) return text({ error: "check needs image: base64 of your render at that moment" });
        const tmp = path.join(tmpdir(), `lookap-uref-${process.pid}-${Math.random().toString(36).slice(2)}.png`);
        await writeFile(tmp, buf);
        const r = await compareBuild(tmp, Buffer.from(image.replace(/^data:[^,]+,/, ""), "base64"), { w: W, h: H }, [], true);
        return text({ ...about, score: r.score, overall: r.overall, regions: r.regions, scale: "detail-weighted, two pixels of tolerance: a close rebuild sits near 70, a wrong one under 20", reading: "no element boxes for a clip of your own: the three regions that differ most name where to zoom next (measure what=zoom with the same image)", usage: u });
      }
      if (what === "zoom") {
        if (!box) return text({ error: "zoom needs box [x, y, w, h] in the clip's pixels" });
        const [x, y, w, h] = box.map((n) => Math.max(0, Math.round(n)));
        if (w < 4 || h < 4 || x + w > W || y + h > H) return text({ error: `box must sit inside the ${W}x${H} frame` });
        const S = Math.max(1, Math.min(4, Math.floor(900 / w)));
        const crop = async (img: Buffer) => sharp(img).extract({ left: x, top: y, width: w, height: h }).resize(w * S, h * S, { kernel: "nearest" }).png().toBuffer();
        const panels = [await crop(await sharp(buf).png().toBuffer())];
        if (image) panels.push(await crop(await sharp(Buffer.from(image.replace(/^data:[^,]+,/, ""), "base64")).resize(W, H, { fit: "fill" }).png().toBuffer()));
        const out = await sharp({ create: { width: w * S * panels.length + 12 * (panels.length - 1), height: h * S, channels: 3, background: "#ff3b30" } }).composite(panels.map((pn, i) => ({ input: pn, left: i * (w * S + 12), top: 0 }))).png().toBuffer();
        return { content: [{ type: "image" as const, data: out.toString("base64"), mimeType: "image/png" }, { type: "text" as const, text: JSON.stringify({ ...about, box: [x, y, w, h], scale: S, panels: image ? "the clip on the left, your render on the right" : "the clip", usage: u }, null, 2) }] };
      }
      /* colors */
      if (col === undefined && row === undefined) return text({ error: "colors needs col (x) or row (y), with from and to" });
      const along = col !== undefined ? "y" : "x";
      const a = Math.max(0, Math.round(from ?? 0)), b = Math.min(along === "y" ? H - 1 : W - 1, Math.round(to ?? (along === "y" ? H - 1 : W - 1)));
      if (b - a > 400) return text({ error: "keep the line under 400 pixels" });
      const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
      const px = (ix: number, iy: number) => { const o = (Math.min(info.height - 1, iy) * info.width + Math.min(info.width - 1, ix)) * info.channels; return "#" + [0, 1, 2].map((k) => data[o + k].toString(16).padStart(2, "0")).join(""); };
      const line: string[] = [];
      for (let i = a; i <= b; i++) line.push(`${i}:${along === "y" ? px(col!, i) : px(i, row!)}`);
      return text({ ...about, line: along === "y" ? `x=${col}, y ${a} to ${b}` : `y=${row}, x ${a} to ${b}`, colors: line.join(" "), usage: u });
    },
  );

  reg(
    "check_rebuild",
    {
      title: "Check a rebuild against the reference",
      description: "Score your build against the clip. Three ways in: image (one base64 screenshot, with at); images (two to six base64 screenshots with their moments); or, with no base64 at all, call with only slug to get a token and curl upload lines, PUT your screenshots at the clip's moments, then call with slug and token. The token is the same one judge_rebuild uses, so one set of uploads serves both. For any measured entry: a recipe, or a draft (every clip has one). Returns a 0..100 score (detail-weighted: edges, text and texture count up to ten times a flat field, with two pixels of tolerance; a close rebuild sits near 70, a wrong one under 20), the five elements that differ most (reference colour vs yours, deltaE in Lab where under 2 is invisible and 20 a different colour, the shift that would close the gap, and a cause: misplaced, wrong colour or a different drawing), and the three grid regions that differ most with the elements under them. The score is a floor, not the goal: it cannot tell a drawn ring from a glass lens or dim type from white type, so zoom (look_at what=zoom) the elements it names and judge the crops. Use it after building, then fix the top differences and call again. Moving elements are only compared at the first keyframe. Paid.",
      inputSchema: {
        slug: z.string(),
        image: z.string().optional().describe("base64 of a PNG or JPEG screenshot of your build, cropped to the recipe's frame (its crop box when it has one); or pass images instead"),
        at: z.union([z.string(), z.number()]).optional().describe("the keyframe your screenshot shows (a name; default the first, the rest state), or a time in seconds for a clip: the frame is pulled from the clip itself, so any mid-motion moment can be checked"),
        images: z.array(z.object({ at: z.number(), image: z.string() })).min(2).max(6).optional().describe("instead of image and at: two to six screenshots of your render at different moments (seconds), for a clip. Each is scored against the clip's frame at its moment, and consecutive pairs are compared for motion: does your render change where the clip changes. Prefer the rubric's moments from get_brief"),
        token: z.string().optional().describe("the upload token from a call with only slug (or from judge_rebuild): the screenshots PUT under it are scored, no base64 needed"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ slug, image, at, images, token }, extra) => {
      if (!lim.media) return gated("check_rebuild", plan, reason);
      const e = entryFor(slug);
      const recipe = e ? recipeFor(e) : undefined, draft = e && !recipe ? draftFor(e) : undefined;
      if (!e || (!recipe && !draft)) return text({ error: `No measurement for ${slug}`, measured: RECIPES.map((r) => r.slug) });
      const br = await touchEntry(keyRef, plan, e.slug);
      if (br && !br.ok) return tooWide(br);
      /* no base64: issue a token, or score the uploads under one */
      if (!image && !images?.length && draft) {
        if (!dbReady) return text({ error: "the upload store is not configured on this server; pass image or images" });
        const rb = rubricFor(e);
        const want = rb ? [...new Set(rb.criteria.flatMap((c) => [c.at, ...(c.then == null ? [] : [c.then])]).map((t) => Number(t.toFixed(2))))].sort((a, b) => a - b) : [...draft.keyframes.map((k) => k.at), ...draft.mids.map((m) => m.at)].sort((a, b) => a - b);
        if (!token) return text(await issueToken(e, draft.frame.w, draft.frame.h, want, originOf(extra), "call check_rebuild again with slug and the token; judge_rebuild takes the same token when the entry has a rubric"));
        const up = await uploadsOf(token, e.slug);
        if ("error" in up) return text({ error: up.error });
        if (up.ats.length < 1) return text({ error: "no screenshots uploaded yet", moments: want });
        images = await Promise.all(up.ats.slice(0, 8).map(async (a) => ({ at: a, image: (await up.shot(a)).toString("base64") })));
        if (images.length === 1) { image = images[0].image; at = images[0].at; images = undefined; }
      }
      if (images && images.length) {
        /* several moments: pixels per moment, and motion between them */
        if (!draft) return text({ error: "images needs a clip entry with a draft measurement; for a recipe pass image and at" });
        if (images.some((m) => m.image.length > 8_000_000)) return text({ error: "keep each screenshot under 6 MB" });
        const id = clipId(e);
        const clip = id && e.video ? await cachedClip(id, e.video.src).catch(() => null) : null;
        if (!clip) return text({ error: "the clip could not be read right now; try again" });
        const u = await charge(keyRef, plan, "check_rebuild");
        if (u && !u.ok) return spent("check_rebuild", u);
        bump(e.slug, "agent");
        const W = draft.frame.w, H = draft.frame.h;
        const els = draft.elements.map((d, i) => ({ name: `draft ${i + 1} ${d.fill}`, box: d.box, fill: d.fill }));
        const sorted = [...images].sort((a, b) => a.at - b.at).map((m) => ({ ...m, at: Math.max(0, Math.min(draft.duration, m.at)) }));
        const moments: { at: number; score: number; elements: unknown[]; regions: unknown[] }[] = [];
        const changes: { from: number; to: number; clip: number; render: number; read: string }[] = [];
        let prev: { at: number; ref: Buffer; sub: Buffer } | null = null;
        for (const m of sorted) {
          const refPng = await frameAt(clip, m.at);
          const tmp = path.join(tmpdir(), `lookap-ref-${process.pid}-${Math.random().toString(36).slice(2)}.png`);
          await writeFile(tmp, refPng);
          const sub = Buffer.from(m.image.replace(/^data:[^,]+,/, ""), "base64");
          const r = await compareBuild(tmp, sub, draft.frame, els, m === sorted[0]);
          moments.push({ at: m.at, score: r.score, elements: r.elements.slice(0, 3), regions: r.regions.slice(0, 2) });
          const [rawRef, rawSub] = await Promise.all([raw(refPng, W, H), raw(sub, W, H)]);
          if (prev) { const c = changedArea(prev.ref, rawRef, W, H), sr = changedArea(prev.sub, rawSub, W, H); changes.push({ from: prev.at, to: m.at, clip: c, render: sr, read: motionRead(c, sr) }); }
          prev = { at: m.at, ref: rawRef, sub: rawSub };
        }
        const still = changes.filter((c) => c.read === "render still where the clip moves");
        const clipMoves = changes.some((c) => c.clip > 0.3), renderMoves = changes.some((c) => c.render > 0.3);
        const motion = !clipMoves ? "the clip does not move between these moments; pick moments inside a measured phase (get_brief lists them)" : !renderMoves ? "STATIC: the clip moves between these moments and your render does not; the timeline is missing or not seekable (use CSS animations or element.animate started at load, no timers)" : still.length ? `your render stays still in ${still.length} of ${changes.length} spans where the clip moves` : "your render changes where the clip changes";
        return text({ slug, measured: "draft", score: Math.round(moments.reduce((s, m) => s + m.score, 0) / moments.length), moments, motion: { read: motion, changes, scale: "clip and render are the share of the frame whose colour changed between the two moments, in percent" }, usage: u, reading: "score per moment as for a single image; the motion block is what one screenshot cannot show. The score is a floor: zoom (look_at what=zoom with your image) the elements named, and run judge_rebuild for the checklist when the entry has a rubric" });
      }
      if (!image) return text({ error: "pass image (one screenshot, with at) or images (two to six, each with its moment)" });
      if (image.length > 8_000_000) return text({ error: "Image too large: keep the screenshot under 6 MB" });
      const frames = recipe?.keyframes ?? draft!.keyframes;
      /* a time in seconds: the reference is the clip's own frame at that moment, written beside the stored ones */
      let kf: { name: string; at: number; src: string } | undefined;
      if (typeof at === "number") {
        const id = clipId(e);
        const clip = id && e.video ? await cachedClip(id, e.video.src).catch(() => null) : null;
        if (!clip) return text({ error: "the clip could not be read right now; pass a keyframe name instead" });
        const t = Math.max(0, Math.min(e.duration ?? at, at));
        const png = await frameAt(clip, t);
        const tmp = path.join(tmpdir(), `lookap-ref-${process.pid}-${Math.random().toString(36).slice(2)}.png`);
        await writeFile(tmp, png);
        kf = { name: `${t}s`, at: t, src: tmp };
      } else kf = frames.find((k) => k.name === (at ?? frames[0].name));
      if (!kf) return text({ error: `No keyframe ${at}`, available: frames.map((k) => k.name) });
      const frame = recipe?.frame ?? draft!.frame;
      const elements = recipe?.elements ?? draft!.elements.map((d, i) => ({ name: `draft ${i + 1} ${d.fill}`, box: d.box, fill: d.fill }));
      const u = await charge(keyRef, plan, "check_rebuild");
      if (u && !u.ok) return spent("check_rebuild", u);
      bump(e.slug, "agent");
      try {
        const buf = Buffer.from(image.replace(/^data:[^,]+,/, ""), "base64");
        const ref = kf.src.startsWith("/") && !kf.src.startsWith(tmpdir()) ? path.join(process.cwd(), "public", kf.src.replace(/^\//, "")) : kf.src;
        const result = await compareBuild(ref, buf, frame, elements, kf === frames[0]);
        const checks = recipe ? recipe.checks.filter((c) => c.at === kf.name).map((c) => c.check) : ["draft: the regions are reliable; the element rows use first-pass boxes, so weigh them by eye"];
        return text({ slug, keyframe: kf.name, measured: recipe ? "recipe" : "draft", ...result, scale: "since 2026-10-22 the score weighs edges, text and texture up to ten times a flat field and judges each pixel against the closest match within two pixels: a close rebuild sits near 70, a wrong one under 20; files scored before read higher on the old scale", checks, usage: u, reading: "score is 0..100 for the whole frame; overall is the mean weighted per-channel difference behind it (0 identical, 40 and more a different picture); each element row gives delta (its own difference), colour (mean colour gap), deltaE (the same gap in Lab: under 2 invisible, 5 a shade, 20 a different colour), shift (how far your box sits from the reference, if moving it helps) and a cause: misplaced, wrong colour, or a different drawing; delta is the mean per-channel difference over the box, 0 identical; fix the largest elements first, then the regions; the checks are what to verify by eye or by measuring your own render" });
      } catch (err) {
        return text({ error: err instanceof Error ? err.message : "compare failed" });
      }
    },
  );

  /* the upload side channel shared by check_rebuild and judge_rebuild: a token, the moments to render, curl lines */
  const originOf = (extra: unknown) => { try { const h = (extra as { requestInfo?: { headers?: Record<string, string | string[] | undefined> } }).requestInfo?.headers ?? {}; const host = String(h["x-forwarded-host"] ?? h["host"] ?? ""); const proto = String(h["x-forwarded-proto"] ?? (host.startsWith("localhost") ? "http" : "https")); return host ? `${proto}://${host}` : "https://lookap.saidev.codes"; } catch { return "https://lookap.saidev.codes"; } };
  const issueToken = async (e: Entry, W: number, H: number, moments: number[], origin: string, next: string) => {
    const t = randomBytes(12).toString("hex");
    await kv().set(`judge:${t}`, { slug: e.slug, w: W, h: H, mark: fingerprint(keyRef) }, { ex: 900 });
    return {
      slug: e.slug, token: t, expires: "15 minutes",
      render: { frame: `${W}x${H}`, moments, how: "open your file at exactly the frame size with ?demo=1, seek every animation to the moment (document.getAnimations().forEach(a => { a.pause(); a.currentTime = t * 1000 })), wait 150 ms, screenshot; one PNG per moment" },
      upload: { address: `${origin}/api/judge/${t}/<moment>`, how: moments.map((m) => `curl -s -T shot-${m}.png ${origin}/api/judge/${t}/${m}`), uploaded: `${origin}/api/judge/${t}/shots` },
      then: next,
    };
  };
  const uploadsOf = async (token: string, slug: string) => {
    if (!/^[a-f0-9]{24}$/.test(token)) return { error: "bad token" } as const;
    const tk = (await kv().get<{ slug: string }>(`judge:${token}`)) ?? null;
    if (!tk || tk.slug !== slug) return { error: "token unknown, expired or for another entry: call without a token for a new one" } as const;
    const ats = ((await kv().smembers(`judge:${token}:ats`)) as string[]).map(Number).sort((a, b) => a - b);
    const shots = new Map<number, Buffer>();
    const shot = async (a: number) => { let b = shots.get(a); if (!b) { b = Buffer.from((await kv().get<string>(`judge:${token}:shot:${a}`)) ?? "", "base64"); shots.set(a, b); } return b; };
    return { ats, shot } as const;
  };

  reg(
    "judge_rebuild",
    {
      title: "Judge a rebuild against its rubric",
      description: "The checklist, judged by a model you run, on evidence lookap composes: for every criterion, a crop of the clip beside the same crop of your render at the criterion's moment (two rows for motion), packed into a few sheets. No screenshot or sheet passes through your context as base64. Call it once without a token: you get a token, the moments to render, and an upload address for curl. Render your page at the frame size at each moment, PUT each screenshot to the address, then call again with the token: you get the sheet links, the criteria per sheet, the judge instruction and the output schema. Run the judge as a subagent on your strongest vision model (not the one that wrote the file) with only those, fix every no, and repeat. Needs an entry with a rubric (get_brief says) and Pro; metered as a rebuild check.",
      inputSchema: {
        slug: z.string(),
        token: z.string().optional().describe("the token from the first call, once the screenshots are uploaded"),
        inline: z.boolean().optional().describe("with the token: also return the sheets as images in this result, for a client that cannot fetch a link; this spends your own context on them, so leave it off when you can run curl"),
      },
      annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ slug, token, inline }, extra) => {
      if (!lim.media) return gated("judge_rebuild", plan, reason);
      const e = entryFor(slug);
      if (!e) return text({ error: `No entry ${slug}` });
      const rb = rubricFor(e), draft = draftFor(e);
      if (!rb || !draft) return text({ error: `${slug} has no rubric yet; check_rebuild with several screenshots and look_at what=zoom are the checks for it` });
      if (!dbReady) return text({ error: "the judge's store is not configured on this server" });
      const br = await touchEntry(keyRef, plan, e.slug);
      if (br && !br.ok) return tooWide(br);
      const W = rb.frame.w, H = rb.frame.h;
      const need = [...new Set(rb.criteria.flatMap((c) => [c.at, ...(c.then == null ? [] : [c.then])]).map((t) => Number(t.toFixed(2))))].sort((a, b) => a - b);
      const origin = originOf(extra);
      if (!token) return text({ ...(await issueToken(e, W, H, need, origin, "call judge_rebuild again with slug and the token; the same token also serves check_rebuild for the pixel and motion read")), criteria: rb.criteria.length });
      const up = await uploadsOf(token, e.slug);
      if ("error" in up) return text({ error: up.error });
      const { ats } = up;
      if (!ats.length) return text({ error: "no screenshots uploaded yet", upload: `${origin}/api/judge/${token}/<moment>`, moments: need });
      const id = clipId(e);
      const clip = id && e.video ? await cachedClip(id, e.video.src).catch(() => null) : null;
      if (!clip) return text({ error: "the clip could not be read right now; try again" });
      const u = await charge(keyRef, plan, "check_rebuild");
      if (u && !u.ok) return spent("check_rebuild", u);
      bump(e.slug, "agent");
      const info = await clipInfo(clip);
      const k = info.width / W;
      const have = (t: number) => ats.find((a) => Math.abs(a - t) <= 0.2);
      const frames = new Map<number, Buffer>();
      const clipAt = async (t: number) => { let f = frames.get(t); if (!f) { f = await frameAt(clip, t); frames.set(t, f); } return { frame: f, k }; };
      const renderAt = async (t: number) => up.shot(have(t)!);
      const ready = rb.criteria.filter((c) => have(c.at) !== undefined && (c.then == null || have(c.then) !== undefined));
      const missing = rb.criteria.filter((c) => !ready.includes(c));
      /* whole-frame criteria look at the design, not the canvas around it */
      const first = await clipAt(ready[0]?.at ?? draft.keyframes[0].at);
      const cb = await contentBox(first.frame, draft.background);
      const frameBox = cb.map((n) => Math.round(n / k)) as [number, number, number, number];
      const tiles: { id: string; png: Buffer }[] = [];
      for (const c of ready.slice(0, 60)) tiles.push({ id: c.id, png: await judgeTile(c, W, H, clipAt, renderAt, 420, frameBox) });
      const sheets = await packSheets(tiles, 1600, 1600, 70);
      await Promise.all(sheets.map((sh, i) => kv().set(`judge:${token}:sheet:${i + 1}`, sh.jpeg.toString("base64"), { ex: 900 })));
      const photo = new Set(rb.imagery.filter((m) => m.class === "photo").map((m) => m.name.toLowerCase()));
      const policy = (c: (typeof rb.criteria)[number]) => !rb.licensed && photo.has(c.element.toLowerCase()) && !["imagery", "position", "motion"].includes(c.axis);
      /* motion from the uploads, as check_rebuild reads it */
      const changes: { from: number; to: number; clip: number; render: number; read: string }[] = [];
      let prev: { at: number; ref: Buffer; sub: Buffer } | null = null;
      for (const a of ats.slice(0, 8)) {
        const [rr, rs] = await Promise.all([raw((await clipAt(a)).frame, W, H), raw(await renderAt(a), W, H)]);
        if (prev) { const c = changedArea(prev.ref, rr, W, H), s2 = changedArea(prev.sub, rs, W, H); changes.push({ from: prev.at, to: a, clip: c, render: s2, read: motionRead(c, s2) }); }
        prev = { at: a, ref: rr, sub: rs };
      }
      const clipMoves = changes.some((c) => c.clip > 0.3), renderMoves = changes.some((c) => c.render > 0.3);
      const body = {
        slug, token, uploaded: ats,
        sheets: sheets.map((sh, i) => ({ url: `${origin}/api/judge/${token}/sheet-${i + 1}.jpg`, size: `${sh.width}x${sh.height}`, kb: Math.round(sh.jpeg.length / 1024), criteria: sh.ids })),
        criteria: ready.map((c) => ({ id: c.id, sheet: sheets.findIndex((sh) => sh.ids.includes(c.id)) + 1, axis: c.axis, element: c.element, check: c.check, panels: c.then == null ? `clip ${c.at}s | yours ${c.at}s` : `rows: ${c.at}s then ${c.then}s; clip left, yours right`, policy: policy(c) ? "photo-class region, designer declined sampling: judged as written but not required to pass; a placeholder of the box and palette is the rule" : undefined })),
        notJudged: missing.map((c) => ({ id: c.id, needs: [c.at, ...(c.then == null ? [] : [c.then])].filter((t) => have(t) === undefined), check: c.check })),
        motion: changes.length ? { read: !clipMoves ? "the clip does not move between the uploaded moments" : !renderMoves ? "STATIC: the clip moves between the uploaded moments and your render does not" : "your render changes where the clip changes", changes } : "upload two or more moments for a motion read",
        judge: { instruction: JUDGE_INSTRUCTION, schema: JUDGE_SCHEMA, delegate: JUDGE_DELEGATION, done: "every criterion not marked policy answers yes, and motion is not STATIC" },
        expires: "the sheets and uploads live 15 minutes",
        usage: u,
      };
      if (!inline) return text(body);
      return { content: [...sheets.map((sh) => ({ type: "image" as const, data: sh.jpeg.toString("base64"), mimeType: "image/jpeg" })), { type: "text" as const, text: JSON.stringify(body, null, 2) }] };
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
            "4. Render your build at the frame size at the moments the brief lists (with ?demo=1, every animation seeked to the moment) and screenshot each. Call check_rebuild with only the slug for an upload token, PUT the screenshots with the curl lines it gives (no base64 through your context), then call it again with the token: the pixel score per moment and the motion read; STATIC means your timeline is missing or not seekable. Every round, call look_at what=zoom on the worst element it names with your screenshot as image, and Read the crop: the clip on the left, yours on the right. Fix what the crop shows, then check again. The score is a floor, never the goal.",
            "5. When the brief carries a rubric: call judge_rebuild with the same token (the uploads serve both), and run the judge as it says: a subagent on your strongest vision model, given only the sheet links, the criteria and the instruction. Fix every criterion it answers no, re-render, upload and judge again. Done means every criterion passes and the render moves where the clip moves; after three judged rounds stop and report what still fails, with the judge's words. Photo-class imagery is sampled from the clip under the entry's licence, the default, and stood in only where the brief says the designer declined.",
            "6. For each keyframe in the recipe, call see_design with `at` and compare your build in that state against the checks for it. Report what still differs, in one list, with numbers.",
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
      return text({ plan: PLAN_NAME[plan], today: usage.today, entriesToday: usage.entries, quotas: usage.month, unmetered: Object.keys(LOCK).filter((t) => lim[LOCK[t]] && !QUOTAS[plan][t] && t !== "judge_rebuild").concat(["search_designs", "get_design", "get_brief", "similar_designs", "list_notes", "get_note", "get_method"]), sharedMeters: { judge_rebuild: "check_rebuild" }, notOnThisPlan: hidden, upgrade: hidden.length ? "/pricing" : null });
    },
  );

  /* a paid key does not see the tools its plan lacks */
  if (plan !== "none") for (const [name, need] of Object.entries(LOCK)) if (!lim[need]) handles[name]?.disable();

  return server;
}

/* The brake (60 a minute on a key) counts tool calls only. A handshake, tools/list, a ping or a notification is
   verified at no cost, so a client that reconnects or lists often cannot lock its own key out of the tools. */
async function handle(req: Request) {
  let body: string | undefined, counts = false;
  if (req.method === "POST") {
    body = await req.text();
    try { const msg = JSON.parse(body) as { method?: string } | { method?: string }[]; counts = (Array.isArray(msg) ? msg : [msg]).some((m) => m?.method === "tools/call"); } catch { counts = false; }
  }
  const { plan, reason, keyRef, stale } = await resolvePlan(req, { count: counts });
  const server = build(plan, reason, keyRef, stale);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    return await transport.handleRequest(body === undefined ? req : new Request(req.url, { method: req.method, headers: req.headers, body }));
  } finally {
    void transport.close();
    void server.close();
  }
}

/* a look_at on a cold instance fetches the clip and runs ffmpeg; give it room */
export const maxDuration = 60;

export async function POST(req: Request) { return handle(req); }
/* stateless: there is no server-initiated stream to open, so a GET is answered at once and never verified */
export async function GET() { return new Response(null, { status: 405, headers: { allow: "POST, DELETE" } }); }
export async function DELETE(req: Request) { return handle(req); }
