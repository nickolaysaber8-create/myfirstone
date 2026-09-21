import { Studio } from "@/components/studio/Studio";
import { PackCalculator } from "@/components/ui/PackCalculator";

const STAGES = [
  {
    num: "STAGE 01",
    title: "Describe & generate",
    body: "Name the subject. The studio draws it onto the wrap and shows you the camera from every side.",
  },
  {
    num: "STAGE 02",
    title: "Approve the proof",
    body: "We send a flat proof showing exactly how the artwork falls around the lens, flash and viewfinder cutouts.",
  },
  {
    num: "STAGE 03",
    title: "Print & wrap",
    body: "The lab prints on matte waterproof vinyl, strips the blank wrap off the camera and applies yours by hand.",
  },
  {
    num: "STAGE 04",
    title: "Ship & develop",
    body: "Delivered across Lebanon in 3–5 days. Bring the camera back after the event and we develop and scan the roll.",
  },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--line)] backdrop-blur-[10px] [background:color-mix(in_srgb,var(--paper)_88%,transparent)]">
        <div className="wrapper flex h-[60px] items-center gap-5">
          <span className="flex items-center gap-2.5 font-display text-[19px] font-extrabold tracking-tight">
            <span
              aria-hidden
              className="h-4 w-4 flex-none rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 34% 32%, #fff 0 12%, var(--magenta) 13% 55%, #2a1b26 56% 100%)",
                boxShadow: "0 0 0 2px var(--surface), 0 0 0 3px var(--ink)",
              }}
            />
            Snapwrap
          </span>
          <nav className="ml-auto flex items-center gap-5 text-sm">
            <a href="#how" className="hidden text-[var(--ink-2)] hover:text-[var(--ink)] sm:inline">
              How it works
            </a>
            <a href="#packs" className="hidden text-[var(--ink-2)] hover:text-[var(--ink)] sm:inline">
              Packs &amp; pricing
            </a>
            <a href="#order" className="sw-btn sw-btn-accent no-underline">
              Order
            </a>
          </nav>
        </div>
      </header>

      <main>
        <div className="wrapper pb-5 pt-9">
          <p className="sw-eyebrow mb-3.5">Beirut · 27 exposures · ISO 400</p>
          <h1 className="text-[clamp(34px,6.4vw,58px)] leading-[1.02]">
            Name anything.
            <br />
            We wrap a camera in it.
          </h1>
          <p className="mt-3.5 max-w-[46ch] text-[17px] text-[var(--ink-2)]">
            Write &ldquo;dolphins at sunset&rdquo; and you get dolphins. Turn the camera around,
            check every side, then we print it and ship it anywhere in Lebanon.
          </p>

          <Studio />
        </div>

        <section id="how" className="border-t border-[var(--line)] py-14">
          <div className="wrapper">
            <div className="max-w-[54ch]">
              <h2 className="text-[clamp(25px,3.6vw,36px)]">
                From a sentence to a camera in your hand
              </h2>
              <p className="mt-2.5 text-[var(--ink-2)]">
                Four stages, and you approve the proof before anything gets printed.
              </p>
            </div>

            <div className="mt-7 grid gap-px overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
              {STAGES.map((stage) => (
                <div key={stage.num} className="bg-[var(--surface)] px-4 py-5">
                  <span className="font-mono text-xs tracking-widest text-[var(--magenta)]">
                    {stage.num}
                  </span>
                  <h3 className="mb-1.5 mt-2 text-[17px]">{stage.title}</h3>
                  <p className="m-0 text-sm text-[var(--ink-2)]">{stage.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex items-start gap-3.5 rounded-[14px] border border-[color-mix(in_srgb,var(--cyan)_35%,transparent)] bg-[var(--cyan-soft)] px-4 py-4">
              <span className="flex-none pt-px font-mono text-[13px] text-[var(--cyan)]">NOTE</span>
              <p className="m-0 text-sm text-[var(--ink-2)]">
                <strong className="text-[var(--ink)]">
                  We wrap unbranded single-use cameras
                </strong>
                , not re-skinned branded stock. Same 27-exposure ISO 400 film and built-in flash,
                with a blank body made to be printed on — so the artwork is yours end to end and
                nobody&rsquo;s logo gets covered up.
              </p>
            </div>
          </div>
        </section>

        <section id="packs" className="border-t border-[var(--line)] py-14">
          <div className="wrapper">
            <div className="max-w-[54ch]">
              <h2 className="text-[clamp(25px,3.6vw,36px)]">One camera, or a table full of them</h2>
              <p className="mt-2.5 text-[var(--ink-2)]">
                The same design on every camera, or a different one per table — price is per camera
                either way.
              </p>
            </div>
            <PackCalculator />
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] pb-10 pt-8 text-[13px] text-[var(--ink-3)]">
        <div className="wrapper flex flex-wrap justify-between gap-4">
          <span>Snapwrap · Beirut, Lebanon</span>
          <span className="font-mono">Preview build — checkout and shipping are not live</span>
        </div>
      </footer>
    </>
  );
}
