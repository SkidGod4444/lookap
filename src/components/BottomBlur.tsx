"use client";

import { useEffect, useState } from "react";
import { useIsProject } from "./useIsProject";

/* Progressive blur along the bottom of the viewport. Two stacked backdrop layers, the blurrier one masked lower, so
   content softens as it leaves the screen; two, not four, since each layer is recomposited on every scroll and video
   frame beneath it. Fades out while the footer is in view, so the end of the page is crisp. */
export function BottomBlur() {
  const [hidden, setHidden] = useState(false);
  const isProject = useIsProject();
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => setHidden(entries.some((e) => e.isIntersecting)), { rootMargin: "0px 0px -24px 0px", threshold: 0 });
    io.observe(footer);
    return () => io.disconnect();
  }, []);
  if (isProject) return null;
  return (
    <div aria-hidden="true" className={`pointer-events-none fixed inset-x-0 bottom-0 z-[60] h-20 transition-opacity duration-300 ${hidden ? "opacity-0" : "opacity-100"}`}>
      <i className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,#000_0%,#000_40%,transparent_100%)]" />
      <i className="absolute inset-0 backdrop-blur-[6px] [mask-image:linear-gradient(to_top,#000_0%,#000_12%,transparent_45%)]" />
    </div>
  );
}
