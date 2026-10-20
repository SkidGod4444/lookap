import { TOOLS } from "@/lib/data";
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl py-6">
      <h1 className="text-[22px] font-medium tracking-[-0.015em] text-foreground">Design Tools</h1>
      <p className="mt-2 text-sm text-subtle">Curated design tools, deals and directories.</p>
      {TOOLS.map((g) => (
        <section key={g.group} className="mt-8">
          <h2 className="text-sm font-medium text-foreground">{g.group}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {g.items.map((t) => (
              <li key={t.name} className="rounded-xl bg-card p-1 ring-1 ring-line">
                <div className="rounded-lg bg-canvas p-4 ring-1 ring-line">
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="mt-1 text-[13px] text-subtle">{t.blurb}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
