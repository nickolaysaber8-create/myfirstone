"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion, useStageVisibility } from "./hooks";
import { VIEW_LABELS, VIEW_ORDER, type ViewName } from "./viewPresets";
import { renderWrap, type Personalisation, type WrapPreset } from "@/lib/wrap/presets";

const CameraScene = dynamic(() => import("./CameraScene").then((m) => m.CameraScene), {
  ssr: false,
});

type Props = {
  preset: WrapPreset;
  personalisation: Personalisation;
  designCode: string;
};

export function CameraStage({ preset, personalisation, designCode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [wrapSource, setWrapSource] = useState<HTMLCanvasElement | null>(null);
  const [view, setView] = useState<ViewName>("three-quarter");
  const [sceneReady, setSceneReady] = useState(false);

  // The 3D bundle only starts downloading once the stage nears the viewport.
  // On a slow connection the poster is what people see first.
  const { active, hasBeenVisible: shouldLoad } = useStageVisibility(containerRef);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      // A new canvas each time, so the scene sees a genuinely new source and
      // the previous one becomes collectable along with its textures.
      setWrapSource(renderWrap(document.createElement("canvas"), { preset, personalisation }));
    };

    // Fonts matter: the customer's name is drawn into the texture, not laid
    // over it in the DOM, so it has to wait for Archivo to arrive.
    if (document.fonts?.ready) document.fonts.ready.then(draw).catch(draw);
    else draw();

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, preset, personalisation]);

  return (
    <div className="sw-panel overflow-hidden" ref={containerRef}>
      <div
        className="relative"
        style={{
          background: "linear-gradient(170deg, var(--stage-sky), var(--stage-floor))",
        }}
      >
        <div className="relative aspect-[4/3] w-full sm:aspect-[5/4]" data-stage="3d">
          {(!sceneReady || !wrapSource) && (
            <div className="absolute inset-0">
              <Image
                src="/poster/camera-three-quarter.webp"
                alt="Snapwrap camera, three-quarter view"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 430px"
                className="object-contain p-6"
              />
            </div>
          )}

          {shouldLoad && (
            <CameraScene
              wrapSource={wrapSource}
              view={view}
              active={active}
              reducedMotion={reducedMotion}
              onReady={() => setSceneReady(true)}
            />
          )}
        </div>
      </div>

      <div className="border-t border-[var(--line)] p-4">
        <div className="flex flex-wrap justify-center gap-2">
          {VIEW_ORDER.map((name) => (
            <button
              key={name}
              type="button"
              className="sw-viewbtn"
              aria-pressed={view === name}
              onClick={() => setView(name)}
            >
              {VIEW_LABELS[name]}
            </button>
          ))}
        </div>

        <p className="mt-3 text-center font-mono text-[11px] text-[var(--ink-3)]">
          Drag to turn it · pinch to zoom
        </p>

        <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-[var(--line)] pt-3 text-[13px] text-[var(--ink-2)]">
          <span className="font-display font-bold text-[var(--ink)]">{preset.name}</span>
          <span className="font-mono">{designCode}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="sw-spec">Unbranded body</span>
          <span className="sw-spec">Wraps all four sides</span>
          <span className="sw-spec">Matte waterproof laminate</span>
        </div>
      </div>
    </div>
  );
}
