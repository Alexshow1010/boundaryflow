import { spawn } from "node:child_process";
import { chromium } from "playwright-core";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const server = spawn("cmd.exe", ["/d", "/s", "/c", "npm.cmd run dev -- --hostname 127.0.0.1 --port 3100"], {
  cwd: process.cwd(),
  stdio: "ignore"
});

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch("http://127.0.0.1:3100");
      if (response.ok) return;
    } catch {
      // The dev server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error("BoundaryFlow dev server did not become ready in 30 seconds.");
}

const expectedLevels = new Map([
  [640, "normal"],
  [548, "normal"],
  [300, "caution"],
  [150, "restricted"],
  [50, "critical"],
  [20, "critical"]
]);
const viewports = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 }
];

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: viewports[0], deviceScaleFactor: 1 });
  const browserErrors = [];
  page.on("console", message => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", error => browserErrors.push(`pageerror: ${error.message}`));

  await page.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });

  const slider = page.locator('input[type="range"]');
  const geometry = [];
  for (const distance of expectedLevels.keys()) {
    await slider.fill(String(distance));
    await page.waitForTimeout(80);
    geometry.push(await page.evaluate(expectedDistance => {
      const marker = document.querySelector(".marker-geometry");
      const field = document.querySelector(".field");
      const app = document.querySelector(".app-panel");
      const wearable = document.querySelector(".wearable-panel");
      const consolePanel = document.querySelector(".case-card");
      const expectedText = String(expectedDistance);
      return {
        distance: expectedDistance,
        radius: Number(marker?.getAttribute("data-radius")),
        level: [...(field?.classList || [])].find(name => name.startsWith("level-"))?.replace("level-", ""),
        slider: document.querySelector('input[type="range"]')?.value,
        fieldDistance: document.querySelector(".distance-value-svg")?.textContent?.trim(),
        appSynced: Boolean(app?.textContent?.includes(expectedText)),
        wearableLevel: wearable?.querySelector(".wearable-primary > div:nth-child(2) strong")?.textContent?.trim().toLowerCase(),
        consoleLevel: consolePanel?.querySelector(".metrics > div:nth-child(2) strong")?.textContent?.trim().toLowerCase()
      };
    }, distance));
  }

  const layouts = [];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await slider.fill("548");
    await page.waitForTimeout(180);
    layouts.push(await page.evaluate(currentViewport => {
      const rect = selector => document.querySelector(selector)?.getBoundingClientRect();
      const app = rect(".app-panel");
      const field = rect(".field-panel");
      const wearable = rect(".wearable-panel");
      const phone = rect(".phone-shell");
      const primaryActionButtons = [...document.querySelectorAll(".app-actions button")]
        .slice(0, 2)
        .map(button => button.getBoundingClientRect());
      const svg = document.querySelector(".boundary-svg");
      return {
        viewport: currentViewport,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        columns: {
          app: Math.round(app?.width || 0),
          field: Math.round(field?.width || 0),
          wearable: Math.round(wearable?.width || 0)
        },
        app: {
          phoneWidth: Math.round(phone?.width || 0),
          panelHeight: Math.round(app?.height || 0),
          contentClipped: Boolean((phone?.bottom || 0) > (app?.bottom || 0) + 1),
          primaryActionsVisible: Boolean(app && primaryActionButtons.length === 2
            && primaryActionButtons.every(button => button.bottom <= app.bottom + 1))
        },
        field: {
          viewBox: svg?.getAttribute("viewBox"),
          preserveAspectRatio: svg?.getAttribute("preserveAspectRatio"),
          ratio: Number(((svg?.getBoundingClientRect().width || 0) / (svg?.getBoundingClientRect().height || 1)).toFixed(3))
        }
      };
    }, viewport));
    await page.screenshot({
      path: `artifacts/boundaryflow-phase35-${viewport.width}x${viewport.height}.png`,
      fullPage: false
    });
  }

  const radii = geometry.map(item => item.radius);
  const monotonicInward = radii.every((radius, index) => index === 0 || radius < radii[index - 1]);
  const synchronized = geometry.every(item => {
    const expectedLevel = expectedLevels.get(item.distance);
    return item.slider === String(item.distance)
      && item.fieldDistance === String(item.distance)
      && item.level === expectedLevel
      && item.appSynced
      && item.wearableLevel === expectedLevel
      && item.consoleLevel === expectedLevel;
  });
  const layoutStable = layouts.every(item => !item.horizontalOverflow
    && item.columns.app >= 320
    && item.columns.field >= 520
    && item.columns.wearable >= 320
    && item.app.phoneWidth >= 296
    && !item.app.contentClipped
    && item.app.primaryActionsVisible
    && item.field.viewBox === "0 0 800 340"
    && item.field.preserveAspectRatio === "xMidYMid meet");

  const result = { monotonicInward, synchronized, layoutStable, geometry, layouts, browserErrors };
  console.log(JSON.stringify(result, null, 2));
  if (!monotonicInward || !synchronized || !layoutStable || browserErrors.length) process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill();
}
