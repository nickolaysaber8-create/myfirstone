// Bakes the poster placeholder for the 3D stage by rendering the real scene
// in headless Chromium. Run against a dev server:
//   npm run dev  &&  npm run poster
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const url = process.argv[2] ?? "http://localhost:3210/";
const out = "public/poster/camera-three-quarter.webp";

await mkdir("public/poster", { recursive: true });

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

const page = await browser.newPage({ viewport: { width: 900, height: 720 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "domcontentloaded" });

// Chrome that would otherwise overlap an element screenshot.
await page.addStyleTag({
  content: "header{display:none!important} nextjs-portal{display:none!important}",
});
const stage = page.locator('[data-stage="3d"]');
await stage.scrollIntoViewIfNeeded();
await stage.locator("canvas").waitFor({ state: "attached", timeout: 60000 });
await page.waitForTimeout(2500);

// Stop the idle turn so the poster matches the angle the scene opens on.
const box = await stage.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.up();
await page.waitForTimeout(400);

// Land exactly on the preset angle rather than wherever the idle turn stopped.
await page.getByRole("button", { name: "Front", exact: true }).click();
await page.waitForTimeout(1200);
await page.getByRole("button", { name: "Three-quarter", exact: true }).click();
await page.waitForTimeout(2500);

const png = await stage.screenshot();
await browser.close();

// Small enough to arrive before the 3D bundle does on a slow connection.
const info = await sharp(png).resize(720, null, { fit: "inside" }).webp({ quality: 74 }).toFile(out);
console.log(`${out} — ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} kB`);
