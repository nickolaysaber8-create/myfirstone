// Drives the running app in headless Chromium and saves screenshots of the
// 3D stage. Used to check the render and to bake the poster placeholder.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] ?? "http://localhost:3210/";
const outDir = process.argv[3] ?? "shots";
const views = (process.argv[4] ?? "Front,Back,Three-quarter").split(",");

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
  ],
});

async function shoot(width, height, tag) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Chrome that would otherwise overlap an element screenshot.
  await page.addStyleTag({
    content: "header{display:none!important} nextjs-portal{display:none!important}",
  });
  const stage = page.locator('[data-stage="3d"]');
  await stage.scrollIntoViewIfNeeded();
  await stage.locator("canvas").waitFor({ state: "attached", timeout: 60000 });
  await page.waitForTimeout(2500);

  // Stop the idle turn before it drifts, so each preset is what it claims.
  const box = await stage.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(6000);

  for (const view of views) {
    const button = page.getByRole("button", { name: view, exact: true });
    if (await button.count()) {
      await button.first().click();
      await page.waitForTimeout(2200);
    }
    await stage.screenshot({ path: `${outDir}/${tag}-${view.toLowerCase()}.png` });
  }

  await page.screenshot({ path: `${outDir}/${tag}-page.png`, fullPage: false });
  if (errors.length) console.log(`[${tag}] console errors:\n` + errors.slice(0, 12).join("\n"));
  await page.close();
}

await shoot(1280, 900, "desktop");
await shoot(390, 844, "mobile");

await browser.close();
console.log("done ->", outDir);
