import { reconcile } from "@/lib/reconcile";

/* Vercel Cron calls this once a day with CRON_SECRET as a bearer token. ?dry=1 reports what it would change and changes nothing. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("unauthorized", { status: 401 });
  const dryRun = new URL(req.url).searchParams.get("dry") === "1";
  const report = await reconcile({ dryRun });
  if (report.fixes.length || report.failed.length) console.log(`[reconcile] ${dryRun ? "would fix" : "fixed"} ${report.fixes.length} keys; ${report.failed.length} owners not checked`, JSON.stringify(report.fixes));
  return Response.json(report, { headers: { "cache-control": "no-store" } });
}
