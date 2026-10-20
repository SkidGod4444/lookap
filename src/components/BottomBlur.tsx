"use client";

import { useEffect, useState } from "react";

/* Progressive blur along the bottom of the viewport. Four stacked backdrop layers, each blurrier and masked lower,
   so content softens as it leaves the screen. Fades out while the footer is in view, so the end of the page is crisp. */
export function BottomBlur() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => setHidden(entries.some((e) => e.isIntersecting)), { rootMargin: "0px 0px -24px 0px", threshold: 0 });
    io.observe(footer);
    return () => io.disconnect();
  }, []);
  return (
    <div aria-hidden="true" className={`pointer-events-none fixed inset-x-0 bottom-0 z-[60] h-20 transition-opacity duration-300 ${hidden ? "opacity-0" : "opacity-100"}`}>
      <i className="absolute inset-0 backdrop-blur-[1px] [mask-image:linear-gradient(to_top,#000_0%,#000_50%,transparent_100%)]" />
      <i className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,#000_0%,#000_35%,transparent_75%)]" />
      <i className="absolute inset-0 backdrop-blur-[4px] [mask-image:linear-gradient(to_top,#000_0%,#000_20%,transparent_50%)]" />
      <i className="absolute inset-0 backdrop-blur-[8px] [mask-image:linear-gradient(to_top,#000_0%,#000_6%,transparent_28%)]" />
    </div>
  );
}
