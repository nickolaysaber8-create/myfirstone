"use client";

import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import { CameraStage } from "@/components/camera/CameraStage";
import { DesignGrid } from "./DesignGrid";
import { useGeneration } from "./useGeneration";
import type { DesignDTO } from "@/lib/generation/types";
import type { Personalisation } from "@/lib/wrap/compose";

const SUBJECT_CHIPS = [
  "Dolphins jumping over waves",
  "Cedar trees on a green mountain",
  "Blue nazar evil eye charms",
  "Disco ball and stars, neon party",
  "Cherries and hearts, pink",
  "Palm trees on a summer beach",
];

function designCode(designId: string, name: string, date: string): string {
  let h = 2166136261 >>> 0;
  for (const char of `${designId}|${name}|${date}`) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return `SW-${((h >>> 0) % 9000) + 1000}`;
}

export function Studio({ gallery }: { gallery: DesignDTO[] }) {
  const [prompt, setPrompt] = useState("Dolphins jumping over waves at sunset");
  const [name, setName] = useState("RAMI & LYNN");
  const [date, setDate] = useState("12 JUL 2026");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reference, setReference] = useState<{ id: string; name: string } | null>(null);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const { view, generate } = useGeneration();

  // Typing repaints a 1536px texture, so let the keystroke land first.
  const deferredName = useDeferredValue(name);
  const deferredDate = useDeferredValue(date);
  const personalisation: Personalisation = useMemo(
    () => ({ name: deferredName.trim().toUpperCase(), date: deferredDate.trim().toUpperCase() }),
    [deferredName, deferredDate],
  );

  const onUpload = useCallback(async (file: File) => {
    setUploading(true);
    setReferenceError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/reference", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) {
        setReferenceError(payload.error ?? "We couldn't use that photo.");
        return;
      }
      setReference({ id: payload.referenceId, name: payload.name });
    } catch {
      setReferenceError("We couldn't upload that photo. Check your connection.");
    } finally {
      setUploading(false);
    }
  }, []);

  const working = view.status === "working";
  // Once a generation is under way the grid belongs to it: four slots that
  // fill in, rather than the gallery with placeholders tacked on the end.
  const showingResults = working || view.designs.length > 0;
  const shown = showingResults ? view.designs : gallery;
  const pending = working ? Math.max(0, view.total - view.designs.length) : 0;

  // Derived, not synced. With nothing explicitly chosen the camera takes the
  // newest design the moment it lands; a click pins it until the next run.
  const selected = useMemo(() => {
    const pool = [...view.designs, ...gallery];
    const pinned = selectedId ? pool.find((design) => design.id === selectedId) : undefined;
    return pinned ?? view.designs[0] ?? gallery[0] ?? null;
  }, [view.designs, gallery, selectedId]);

  const startGenerating = useCallback(() => {
    // Let the new run choose what the camera shows.
    setSelectedId(null);
    void generate(prompt, reference?.id ?? null);
  }, [generate, prompt, reference]);

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)]">
      <div className="space-y-4">
        <div className="sw-panel p-5">
          <label className="sw-label mb-2" htmlFor="prompt">
            What should be on it?
          </label>
          <textarea
            id="prompt"
            spellCheck={false}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="sw-field min-h-[70px] resize-y leading-snug"
          />

          <div className="mt-2.5 flex flex-wrap gap-2">
            {SUBJECT_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="sw-chip"
                aria-pressed={prompt === chip}
                onClick={() => setPrompt(chip)}
              >
                {chip.split(",")[0]}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className="sw-btn sw-btn-accent flex-1 basis-[200px]"
              disabled={working || prompt.trim().length < 3}
              onClick={startGenerating}
            >
              {working ? `Drawing ${view.completed} of ${view.total}…` : "Generate designs"}
            </button>
            <button
              type="button"
              className="flex-1 basis-[180px] rounded-[10px] border border-dashed border-[var(--line)] px-3.5 py-2.5 text-[13px] text-[var(--ink-2)] hover:border-[var(--magenta)] hover:text-[var(--magenta)]"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : reference ? "Change reference photo" : "+ Add a reference photo"}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onUpload(file);
                event.target.value = "";
              }}
            />
          </div>

          {working && (
            <div
              className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-2)]"
              role="progressbar"
              aria-valuenow={view.completed}
              aria-valuemin={0}
              aria-valuemax={view.total}
            >
              <div
                className="h-full rounded-full bg-[var(--magenta)] transition-[width] duration-500"
                style={{ width: `${Math.max(6, (view.completed / view.total) * 100)}%` }}
              />
            </div>
          )}

          <p className="mt-2 font-mono text-xs text-[var(--ink-3)]">
            {referenceError ??
              (reference
                ? `Matching the palette and mood of ${reference.name}.`
                : "No reference photo — colours come from your words.")}
          </p>

          {view.status === "error" && view.error && (
            <div
              role="alert"
              className="mt-3 flex flex-wrap items-center gap-3 rounded-[10px] border border-[color-mix(in_srgb,var(--magenta)_40%,transparent)] bg-[var(--magenta-soft)] px-3.5 py-3 text-sm"
            >
              <span className="flex-1">{view.error}</span>
              <button
                type="button"
                className="sw-btn"
                onClick={startGenerating}
              >
                Try again
              </button>
            </div>
          )}
        </div>

        <div className="sw-panel p-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="sw-label">
              {showingResults ? "Pick a direction" : "Gallery"}
            </span>
            {view.cached && (
              <span className="font-mono text-[10px] tracking-wider text-[var(--cyan)]">
                ALREADY DRAWN — NO WAIT
              </span>
            )}
          </div>

          <DesignGrid
            designs={shown}
            selectedId={selected?.id ?? null}
            onSelect={(design) => setSelectedId(design.id)}
            pending={pending}
          />

          <p className="mt-3 font-mono text-xs text-[var(--ink-3)]">
            {showingResults
              ? "Each option lays the same subject out differently. Regenerate as often as you like."
              : "Drawn already, so browsing is instant and free. Describe something to get your own."}
          </p>
        </div>

        <div className="sw-panel p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="sw-label mb-2" htmlFor="camName">
                Text on the camera
              </label>
              <input
                className="sw-field"
                id="camName"
                maxLength={18}
                value={name}
                spellCheck={false}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div>
              <label className="sw-label mb-2" htmlFor="camDate">
                Date or note
              </label>
              <input
                className="sw-field"
                id="camDate"
                maxLength={18}
                value={date}
                spellCheck={false}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>
          <p className="mt-2 font-mono text-xs text-[var(--ink-3)]">
            Printed into the wrap on the front face, below the lens and clear of every cutout.
          </p>
        </div>
      </div>

      <div className="order-first lg:order-none lg:sticky lg:top-[76px]">
        <CameraStage
          design={selected}
          personalisation={personalisation}
          designCode={designCode(selected?.id ?? "", personalisation.name ?? "", personalisation.date ?? "")}
        />
      </div>
    </div>
  );
}
