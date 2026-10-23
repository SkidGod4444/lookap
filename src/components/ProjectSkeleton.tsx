/* What an entry page looks like before its content arrives: the stage with an empty frame, and the side panel with
   bars where the title, credit and facts go. Same layout and colours as the page, so the swap does not jump. */
export function ProjectSkeleton() {
  return (
    <div className="-mx-4 -mt-4 -mb-4 flex flex-1 flex-col lg:h-[calc(100vh_-_57px)] lg:flex-none lg:flex-row lg:overflow-hidden" aria-busy="true" aria-label="Loading">
      <div className="flex min-w-0 flex-1 items-center justify-center bg-gutter p-6 sm:p-10">
        <div className="w-full max-w-[900px]">
          <div className="aspect-[16/10] w-full animate-pulse rounded-[5px] bg-card ring-1 ring-line" />
          <div className="mt-4 flex items-center gap-3">
            <div className="h-8 w-[148px] rounded-full bg-card" />
            <div className="h-3 w-56 rounded bg-card" />
          </div>
        </div>
      </div>
      <aside className="w-full shrink-0 border-t border-line bg-canvas px-5 pt-6 pb-10 lg:h-full lg:w-[280px] lg:border-t-0 lg:border-l">
        <div className="flex flex-col gap-3">
          <div className="h-5 w-3/4 animate-pulse rounded bg-card" />
          <div className="h-3 w-full rounded bg-card" />
          <div className="h-3 w-5/6 rounded bg-card" />
          <div className="mt-4 h-9 w-full rounded-lg bg-card" />
          <div className="mt-4 h-3 w-1/2 rounded bg-card" />
          <div className="h-3 w-2/3 rounded bg-card" />
        </div>
      </aside>
    </div>
  );
}
