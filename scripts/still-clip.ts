/* Turn page screenshots into 3-second still clips in lookap's bucket, so measuring, the checklist and the factory treat
   them like any clip. The importer does this itself now (scripts/lib/media.ts stillClip); this is for a list made by
   hand: measure/stills.json, [{ "id": "<id>", "src": "<screenshot url>" }]. Prints each clip's bucket URL. */
import { readFileSync } from "node:fs";
import { stillClip } from "./lib/media";

const stills = JSON.parse(readFileSync("measure/stills.json", "utf8")) as { id: string; src: string }[];
for (const s of stills) console.log(`${s.id}: ${await stillClip(s.id, s.src)}`);
