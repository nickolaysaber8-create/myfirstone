"use client";

import { useEffect, useRef } from "react";
import { FACE_SPANS } from "@/lib/camera/dimensions";
import { renderWrap, WRAP_PRESETS, type Personalisation, type WrapPreset } from "@/lib/wrap/presets";

const THUMB_W = 360;
const THUMB_H = 225;

function Thumbnail({
  preset,
  personalisation,
}: {
  preset: WrapPreset;
  personalisation: Personalisation;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const draw = () => {
      const strip = renderWrap(document.createElement("canvas"), {
        preset,
        personalisation,
        width: 1024,
      });
      canvas.width = THUMB_W;
      canvas.height = THUMB_H;
      const ctx = canvas.getContext("2d")!;
      // Thumbnails show the front face only — the part people judge first.
      const { start, end } = FACE_SPANS.front;
      ctx.drawImage(
        strip,
        start * strip.width,
        0,
        (end - start) * strip.width,
        strip.height,
        0,
        0,
        THUMB_W,
        THUMB_H,
      );
    };

    if (document.fonts?.ready) document.fonts.ready.then(draw).catch(draw);
    else draw();
  }, [preset, personalisation]);

  return <canvas ref={ref} className="block h-full w-full" />;
}

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
  personalisation: Personalisation;
};

export function WrapPresetGallery({ selectedId, onSelect, personalisation }: Props) {
  return (
    <div className="sw-panel p-5">
      <span className="sw-label">Pick a direction</span>
      <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {WRAP_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={selectedId === preset.id}
            aria-label={`Use the ${preset.name} wrap`}
            onClick={() => onSelect(preset.id)}
            className="relative block aspect-[16/10] w-full overflow-hidden rounded-[10px] border-2 bg-[var(--surface-2)] p-0 transition-colors"
            style={{
              borderColor: selectedId === preset.id ? "var(--magenta)" : "var(--line)",
            }}
          >
            <Thumbnail preset={preset} personalisation={personalisation} />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 pb-1 pt-3 text-right font-mono text-[9px] tracking-wider text-white">
              {preset.name}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 font-mono text-xs text-[var(--ink-3)]">
        Curated gallery — drawn already, so browsing is instant and free.
      </p>
    </div>
  );
}
