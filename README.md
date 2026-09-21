# Snapwrap

Custom-designed single-use film cameras, Beirut. Customers describe artwork,
the studio generates a wrap, a print shop prints it onto a blank 27-exposure
camera and ships it.

We wrap **unbranded** blank bodies. No other manufacturer's name, logo or trade
dress goes into the code, the copy or the generated artwork.

## Running it

Needs Postgres. Copy `.env.example` to `.env` and point `DATABASE_URL` at it.

```bash
npm install
npx prisma migrate dev     # create the schema
npm run seed               # draw the curated gallery
npm run dev                # http://localhost:3000
npm run typecheck
npm run build
```

With no image-model credentials the studio draws the artwork itself, so
everything works out of the box. Set `IMAGE_PROVIDER` and the matching key in
`.env` to hand generation to a real model. Keys are read server-side only and
never reach the browser.

## Where things are

| Path | What it holds |
| --- | --- |
| `src/lib/camera/dimensions.ts` | The blank body in millimetres, and every derived number: wrap perimeter, print resolution, cutout positions. Single source of truth. |
| `src/lib/camera/bodyGeometry.ts` | The body, swept from a rounded-rect cross-section so the wrap maps by true arc length around the perimeter. |
| `src/lib/camera/parts.ts` | Bezels, knurled winder, lens curvature, counter dial. |
| `src/lib/camera/materials.ts` | One material per real part — laminate, shell, lens glass, flash reflector, winder. |
| `src/lib/camera/wrapMaps.ts` | Derives roughness and normal maps from the artwork so print reads as ink on vinyl. |
| `src/lib/camera/studioEnvironment.ts` | Procedural studio lighting, PMREM-filtered. No `.hdr` download. |
| `src/lib/wrap/layout.ts` | Body coordinates → positions on the flat wrap, including the clear zone for customer text. Read by the 3D preview, and later by the proof view and print file. |
| `src/lib/wrap/compose.ts` | Repeats a generated tile around the body and lays the customer's text over it. |
| `src/components/camera/` | react-three-fiber scene, orbit controls, view presets, lazy loading. |
| `src/lib/generation/` | The studio: house-style prompt, provider adapters, render pipeline, cache and rate limit. |
| `src/lib/storage/` | S3-compatible bucket behind an interface, with a local driver for dev. |
| `src/lib/pricing.ts` | The four bulk tiers, in USD. |
| `prisma/` | Schema, migrations, and the seed that bakes the curated gallery. |

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

## Generation

The model returns a **tile**, not the whole wrap. The print shop quotes a
112 × 38 mm footprint, which is narrower than the 292.3 mm the wrap has to
travel, so the tile is stood up to the full body height and repeated about 1.65
times around. That is why the house style demands seamless left and right
edges — the join recurs rather than happening once at a glue seam.

- Four results come from four different composition briefs (scattered, hero,
  repeat, band), not four seeds, so they are genuine variations.
- A prompt naming a manufacturer or brand is refused, not quietly rewritten.
  That artwork would end up printed on something we sell.
- Repeat prompts hit a cache keyed on the words, the reference photo and the
  house-style version. Bump `HOUSE_STYLE_VERSION` to retire old results.
- Resubmitting a prompt already running rejoins it instead of spending another
  slot against the rate limit.
- Progress reports variants that actually finished. A failure surfaces a
  sentence the customer can read, with a retry they choose to press.
- Reference photos are re-encoded on upload, which strips EXIF — including the
  location a phone writes into it — before anything is stored.

## Not built yet

The proof view and print PDF, accounts and saved designs, event packs,
checkout, the admin queue and transactional email. The order summary is wired
to real pricing but clearly marked as not live.
