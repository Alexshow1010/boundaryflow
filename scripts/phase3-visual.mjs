import { chromium } from "playwright-core";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const browserErrors = [];
await page.clock.install({ time: new Date("2026-07-20T18:30:34+08:00") });

page.on("console", message => {
  if (message.type() === "error") browserErrors.push(`console: ${message.text()} ${message.location().url}`.trim());
});
page.on("pageerror", error => browserErrors.push(`pageerror: ${error.message}`));

const integrity = async () => page.evaluate(() => ({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  scrollWidth: document.documentElement.scrollWidth,
  scrollHeight: document.documentElement.scrollHeight,
  noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
  consoleVisible: Boolean(document.querySelector(".console-panel")),
  fieldWidth: Math.round(document.querySelector(".field-panel")?.getBoundingClientRect().width || 0),
  appWidth: Math.round(document.querySelector(".app-panel")?.getBoundingClientRect().width || 0),
  wearableWidth: Math.round(document.querySelector(".wearable-panel")?.getBoundingClientRect().width || 0)
}));
const advanceDemo = async seconds => {
  for (let second = 0; second < seconds; second += 1) {
    await page.clock.fastForward(1000);
    await page.waitForTimeout(24);
  }
};

await page.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
const initialTimelineTime = await page.locator(".event-list time").first().textContent();

await page.getByRole("button", { name: "Silent Notify", exact: true }).click();
const feedbackVisible = await page.getByText("Silent notification sent", { exact: true }).isVisible();
await page.getByRole("button", { name: "重置", exact: true }).click();
await page.getByRole("button", { name: /Auto Demo/ }).click();
await advanceDemo(6);
await page.waitForTimeout(150);
const awarenessVisible = await page.getByText("AWARENESS", { exact: true }).first().isVisible();
await page.getByRole("button", { name: /暫停/ }).click();
const pausedLabel = await page.locator(".control.primary em").textContent();
await page.clock.fastForward(1200);
await page.waitForTimeout(100);
const pausedStable = pausedLabel === await page.locator(".control.primary em").textContent();
await page.getByRole("button", { name: /繼續/ }).click();

await advanceDemo(23);
await page.waitForTimeout(180);
await page.getByText("CRITICAL", { exact: true }).first().waitFor({ state: "visible", timeout: 30000 });
await page.setViewportSize({ width: 1920, height: 1080 });
await page.waitForTimeout(500);
const criticalIntegrity = await integrity();
const criticalRelayActive = await page.locator(".relay-critical").isVisible();
await page.screenshot({ path: "artifacts/boundaryflow-phase3-critical-1920x1080.png", fullPage: false });

await advanceDemo(34);
await page.waitForTimeout(180);
await page.getByText("RETREAT", { exact: true }).first().waitFor({ state: "visible", timeout: 5000 });
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(500);
const retreatIntegrity = await integrity();
await page.screenshot({ path: "artifacts/boundaryflow-phase3-retreat-1440x900.png", fullPage: false });

await advanceDemo(11);
await page.waitForTimeout(180);
await page.getByText("RESOLVED", { exact: true }).first().waitFor({ state: "visible", timeout: 5000 });
await page.setViewportSize({ width: 1366, height: 768 });
await page.waitForTimeout(500);
const resolvedIntegrity = await integrity();
const resolvedEvidenceVisible = await page.locator(".event-list").getByText("事件證據完成封存", { exact: true }).isVisible();
await page.screenshot({ path: "artifacts/boundaryflow-phase3-resolved-1366x768.png", fullPage: false });

await browser.close();

const result = {
  hydrationStableInitialTime: initialTimelineTime === "18:30:34",
  feedbackVisible,
  awarenessVisible,
  pausedStable,
  criticalRelayActive,
  resolvedEvidenceVisible,
  criticalIntegrity,
  retreatIntegrity,
  resolvedIntegrity,
  browserErrors
};

console.log(JSON.stringify(result, null, 2));
const booleanFailure = Object.values(result).some(value => typeof value === "boolean" && !value);
const overflowFailure = [criticalIntegrity, retreatIntegrity, resolvedIntegrity].some(value => !value.noHorizontalOverflow || !value.consoleVisible);
if (browserErrors.length || booleanFailure || overflowFailure) process.exitCode = 1;
