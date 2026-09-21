# Snapwrap

Custom-designed single-use film cameras, Beirut. Customers describe artwork,
the studio generates a wrap, a print shop prints it onto a blank 27-exposure
camera and ships it.

We wrap **unbranded** blank bodies. No other manufacturer's name, logo or trade
dress goes into the code, the copy or the generated artwork.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run build
```

## Where things are

| Path | What it holds |
| --- | --- |
| `src/lib/camera/dimensions.ts` | The blank body in millimetres, and every derived number: wrap perimeter, print resolution, cutout positions. Single source of truth. |
| `src/lib/camera/bodyGeometry.ts` | The body, swept from a rounded-rect cross-section so the wrap maps by true arc length around the perimeter. |
| `src/lib/camera/parts.ts` | Bezels, knurled winder, lens curvature, counter dial. |
| `src/lib/camera/materials.ts` | One material per real part — laminate, shell, lens glass, flash reflector, winder. |
| `src/lib/camera/wrapMaps.ts` | Derives roughness and normal maps from the artwork so print reads as ink on vinyl. |
| `src/lib/camera/studioEnvironment.ts` | Procedural studio lighting, PMREM-filtered. No `.hdr` download. |
| `src/lib/wrap/layout.ts` | Body coordinates → positions on the flat wrap. Read by the 3D preview, and later by the proof view and print file. |
| `src/lib/wrap/presets.ts` | Placeholder artwork for the gallery, drawn seamlessly around the strip. |
| `src/components/camera/` | react-three-fiber scene, orbit controls, view presets, lazy loading. |
| `src/lib/pricing.ts` | The four bulk tiers, in USD. |

## The camera

- Body modelled at 112 × 60 × 38 mm with 4.5 mm vertical corners and a 2.6 mm
  chamfer rolling the wrap onto the decks.
- The wrap is one continuous strip, 292.3 × 60 mm, running front → right →
  back → left. The glue seam sits on the front-left corner, where seamless
  artwork hides it.
- Print file: 300 DPI with 3 mm bleed. The browser gets a 1536 px preview.
- Studio lighting is built as geometry and pre-filtered at runtime, so nobody
  on a slow connection downloads an environment map.
- The scene lazy-loads behind a 14 kB poster, caps pixel ratio, drops
  resolution if frames go long, stops rendering off-screen or in a background
  tab, and turns off its idle rotation under `prefers-reduced-motion`.

Regenerate the poster after changing the model:

```bash
npm run dev
npm run poster       # renders the live scene headless, writes public/poster/
```

`scripts/shoot.mjs` takes the same route for desktop and mobile screenshots
while working on the render.

## Not built yet

Prompt-to-artwork generation, the proof view and print PDF, accounts, event
packs, checkout, the admin queue and transactional email. The gallery and the
order summary are wired to real pricing but clearly marked as not live.
