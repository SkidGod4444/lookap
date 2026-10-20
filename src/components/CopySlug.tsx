"use client";

import { useState } from "react";
import { button } from "./button";

/* The one action a project page can really perform: hand the agent the call. */
export function CopySlug({ slug }: { slug: string }) {
  const [done, setDone] = useState(false);
  const call = `get_design({ slug: "${slug}" })`;
  return (
    <div className="mt-2 flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-md bg-black/50 px-2 py-1.5 font-mono text-[11px] text-silver ring-1 ring-line">{call}</code>
      <button
        type="button"
        onClick={() => { navigator.clipboard?.writeText(call).then(() => { setDone(true); setTimeout(() => setDone(false), 1200); }).catch(() => {}); }}
        className={button("outline", "h-7 shrink-0 rounded-md px-2.5 text-[11px]")}
      >
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
