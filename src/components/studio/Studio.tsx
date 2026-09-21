"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { CameraStage } from "@/components/camera/CameraStage";
import { WrapPresetGallery } from "./WrapPresetGallery";
import { WRAP_PRESETS } from "@/lib/wrap/presets";

function designCode(presetId: string, name: string, date: string): string {
  let h = 2166136261 >>> 0;
  for (const char of `${presetId}|${name}|${date}`) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return `SW-${((h >>> 0) % 9000) + 1000}`;
}

export function Studio() {
  const [presetId, setPresetId] = useState(WRAP_PRESETS[0].id);
  const [name, setName] = useState("RAMI & LYNN");
  const [date, setDate] = useState("12 JUL 2026");

  const preset = useMemo(
    () => WRAP_PRESETS.find((item) => item.id === presetId) ?? WRAP_PRESETS[0],
    [presetId],
  );

  // Typing repaints a 1536px texture, so let the keystroke land first.
  const deferredName = useDeferredValue(name);
  const deferredDate = useDeferredValue(date);
  const personalisation = useMemo(
    () => ({ name: deferredName.trim().toUpperCase(), date: deferredDate.trim().toUpperCase() }),
    [deferredName, deferredDate],
  );

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
            disabled
            defaultValue="Dolphins jumping over waves at sunset"
            className="sw-field min-h-[70px] resize-y leading-snug opacity-60"
          />
          <p className="mt-2 font-mono text-xs text-[var(--ink-3)]">
            Prompt-to-artwork is being wired up to the studio next. Until then, pick from the gallery
            below — every design there is already drawn and costs nothing to browse.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

        <WrapPresetGallery
          selectedId={presetId}
          onSelect={setPresetId}
          personalisation={personalisation}
        />
      </div>

      <div className="order-first lg:order-none lg:sticky lg:top-[76px]">
        <CameraStage
          preset={preset}
          personalisation={personalisation}
          designCode={designCode(preset.id, personalisation.name ?? "", personalisation.date ?? "")}
        />
      </div>
    </div>
  );
}
