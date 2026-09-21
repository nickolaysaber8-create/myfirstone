"use client";

import Image from "next/image";
import { VARIANT_LABELS, type DesignDTO } from "@/lib/generation/types";

type Props = {
  designs: DesignDTO[];
  selectedId: string | null;
  onSelect: (design: DesignDTO) => void;
  /** Slots still being drawn, shown as placeholders so progress is visible. */
  pending?: number;
};

export function DesignGrid({ designs, selectedId, onSelect, pending = 0 }: Props) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {designs.map((design) => (
        <button
          key={design.id}
          type="button"
          aria-pressed={selectedId === design.id}
          aria-label={`Use ${design.name}, ${VARIANT_LABELS[design.variant]} layout`}
          onClick={() => onSelect(design)}
          className="relative block aspect-[16/10] w-full overflow-hidden rounded-[10px] border-2 bg-[var(--surface-2)] p-0"
          style={{ borderColor: selectedId === design.id ? "var(--magenta)" : "var(--line)" }}
        >
          <Image
            src={design.previewUrl}
            alt={design.name}
            fill
            sizes="(max-width: 640px) 45vw, 180px"
            className="object-cover"
            unoptimized
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 pb-1 pt-3 text-right font-mono text-[9px] tracking-wider text-white">
            {VARIANT_LABELS[design.variant]}
          </span>
        </button>
      ))}

      {Array.from({ length: pending }, (_, index) => (
        <div
          key={`pending-${index}`}
          aria-hidden
          className="sw-sheen relative aspect-[16/10] w-full overflow-hidden rounded-[10px] border-2 border-dashed border-[var(--line)] bg-[var(--surface-2)]"
        />
      ))}
    </div>
  );
}
