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
      // Server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error("BoundaryFlow dev server did not become ready.");
}

const viewports = [
  { width: 1920, height: 1080 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
  { width: 1100, height: 800 }
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
  await page.clock.install({ time: new Date("2026-07-20T18:30:34+08:00") });
  await page.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });

  const initialTime = await page.locator(".event-list time").first().textContent();
  const layouts = [];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(120);
    layouts.push(await page.evaluate(currentViewport => {
      const rect = selector => document.querySelector(selector)?.getBoundingClientRect();
      const app = rect(".app-panel");
      const field = rect(".field-panel");
      const wearable = rect(".wearable-panel");
      const phone = rect(".phone-shell");
      const navigation = rect(".phone-nav");
      const phoneTop = rect(".phone-top");
      const appStatus = rect(".app-status-row");
      const shield = rect(".shield-orb");
      const primaryButtons = [...document.querySelectorAll(".app-actions button")]
        .slice(0, 2)
        .map(button => button.getBoundingClientRect());
      const incidentWidths = [...document.querySelectorAll(".incident-controls button")]
        .map(button => Math.round(button.getBoundingClientRect().width));
      const consolePanel = document.querySelector(".console-panel");
      const timeline = document.querySelector(".event-list");
      const narrow = currentViewport.width < 1200;
      return {
        viewport: currentViewport,
        document: {
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
        },
        layout: {
          narrow,
          appWidth: Math.round(app?.width || 0),
          fieldWidth: Math.round(field?.width || 0),
          wearableWidth: Math.round(wearable?.width || 0),
          fieldAboveDevices: narrow ? Boolean(field && app && wearable && field.bottom <= app.top && field.bottom <= wearable.top) : true,
          appBesideWearable: narrow ? Boolean(app && wearable && Math.abs(app.top - wearable.top) < 2) : true
        },
        phone: {
          width: Math.round(phone?.width || 0),
          height: Math.round(phone?.height || 0),
          ratio: Number(((phone?.width || 0) / (phone?.height || 1)).toFixed(3)),
          contained: Boolean(phone && app && phone.left >= app.left && phone.right <= app.right && phone.bottom <= app.bottom),
          navigationContained: !navigation || !navigation.width || Boolean(phone && navigation.bottom <= phone.bottom + 1),
          primaryActionsContained: Boolean(phone && primaryButtons.length === 2
            && primaryButtons.every(button => button.left >= phone.left && button.right <= phone.right && button.bottom <= phone.bottom)),
          statusFirst: Boolean(phoneTop && appStatus && shield
            && appStatus.top >= phoneTop.bottom
            && appStatus.top - phoneTop.bottom <= 24
            && appStatus.bottom < shield.top)
        },
        controls: {
          minIncidentWidth: Math.min(...incidentWidths),
          contained: incidentWidths.every(width => width > 0)
        },
        console: {
          horizontalOverflow: Boolean(consolePanel && consolePanel.scrollWidth > consolePanel.clientWidth + 1),
          timelineScrollable: Boolean(timeline && getComputedStyle(timeline).overflowY === "auto")
        },
        field: {
          viewBox: document.querySelector(".boundary-svg")?.getAttribute("viewBox"),
          preserveAspectRatio: document.querySelector(".boundary-svg")?.getAttribute("preserveAspectRatio")
        }
      };
    }, viewport));
    if (viewport.width === 1536 || viewport.width === 1100) {
      await page.screenshot({ path: `artifacts/boundaryflow-final-${viewport.width}x${viewport.height}.png`, fullPage: true });
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  const slider = page.locator('input[type="range"]');
  const markerChecks = [];
  for (const distance of [640, 300, 150, 50, 20]) {
    await slider.fill(String(distance));
    await page.waitForTimeout(70);
    markerChecks.push(await page.evaluate(value => {
      const marker = document.querySelector(".marker-geometry");
      return {
        distance: value,
        radius: Number(marker?.getAttribute("data-radius")),
        axis: marker?.getAttribute("data-axis"),
        y: getComputedStyle(marker).getPropertyValue("--marker-y").trim(),
        transition: getComputedStyle(marker).transitionTimingFunction
      };
    }, distance));
  }
  const markerStable = markerChecks.every((item, index) => item.axis === "fixed-radial"
    && item.y === "176px"
    && item.transition.includes("0.65")
    && (index === 0 || item.radius < markerChecks[index - 1].radius));
  const sonarStable = await page.evaluate(() => Boolean(
    document.querySelector(".sonar-frame-ring")
    && document.querySelector(".sonar-wedge")
    && document.querySelector(".sonar-leading-edge")
    && document.querySelectorAll(".core-orbit").length === 2
    && !document.querySelector(".core-dome")
  ));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(180);
  await page.screenshot({ path: "artifacts/boundaryflow-final-polish-critical-1920x1080.png", fullPage: false });

  const incidentButtons = page.locator(".incident-controls button");
  await incidentButtons.nth(0).click();
  const offlineWorks = await page.locator(".wearable-panel.offline").isVisible();
  await incidentButtons.nth(1).click();
  await incidentButtons.nth(2).click();
  const suspectedWorks = await page.locator(".wearable-panel.tamper-suspected").isVisible();
  await incidentButtons.nth(3).click();
  const confirmedWorks = await page.locator(".wearable-panel.tamper-confirmed").isVisible();
  await page.locator(".reset-control").click();
  await page.waitForTimeout(180);

  await page.locator(".control.primary").click();
  for (let second = 0; second < 64; second += 1) {
    await page.clock.fastForward(1000);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(300);
  const retreatWorks = await page.locator(".field.level-retreat").isVisible();
  for (let second = 64; second < 74; second += 1) {
    await page.clock.fastForward(1000);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(300);
  const resolvedWorks = await page.locator(".field.level-resolved").isVisible();
  const timelineWorks = await page.locator(".event-list .event").count() >= 7;
  const relayWorks = await page.locator(".relay-list > div").count() === 6;

  const layoutStable = layouts.every(item => !item.document.horizontalOverflow
    && item.layout.appWidth >= 320
    && item.layout.wearableWidth >= 320
    && item.layout.fieldAboveDevices
    && item.layout.appBesideWearable
    && item.phone.width >= 296
    && item.phone.ratio >= 0.62
    && item.phone.ratio <= 0.67
    && item.phone.contained
    && item.phone.navigationContained
    && item.phone.primaryActionsContained
    && item.phone.statusFirst
    && item.controls.minIncidentWidth >= 70
    && item.controls.contained
    && !item.console.horizontalOverflow
    && item.field.viewBox === "0 0 800 340"
    && item.field.preserveAspectRatio === "xMidYMid meet");
  const result = {
    hydrationStable: initialTime === "18:30:34",
    layoutStable,
    markerStable,
    sonarStable,
    offlineWorks,
    suspectedWorks,
    confirmedWorks,
    retreatWorks,
    resolvedWorks,
    timelineWorks,
    relayWorks,
    layouts,
    markerChecks,
    browserErrors
  };
  console.log(JSON.stringify(result, null, 2));
  const failed = Object.entries(result).some(([key, value]) => key !== "layouts" && key !== "markerChecks" && key !== "browserErrors" && value === false);
  if (failed || browserErrors.length) process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill();
}
