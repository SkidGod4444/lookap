/* Put any image or video into lookap's bucket and print its public URL: a URL from vibrant's CDN or any other website,
   or a local file (stored under uploads/<name> unless --key is given).

     bun scripts/to-bucket.ts <url | file> [...] [--key path/in/bucket.ext]   */
import { existsSync } from "node:fs";
import path from "node:path";
import { toBucket, uploadFile } from "./lib/media";

const args = process.argv.slice(2), ki = args.indexOf("--key"), key = ki >= 0 ? args[ki + 1] : null;
const items = args.filter((a, i) => !a.startsWith("--") && !(ki >= 0 && i === ki + 1));
for (const it of items) {
  try {
    const url = existsSync(it) ? await uploadFile(it, key ?? `uploads/${path.basename(it).replace(/[^A-Za-z0-9._-]/g, "_")}`) : await toBucket(it);
    console.log(url ? `${it}\n  -> ${url}` : `${it}\n  -> nothing there (404)`);
  } catch (e) { console.error(`${it}\n  !! ${(e as Error).message}`); process.exitCode = 1; }
}
