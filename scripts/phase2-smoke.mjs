import { chromium } from "playwright-core";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
const browserErrors = [];

page.on("console", message => {
  if (message.type() === "error") browserErrors.push(`console: ${message.text()} ${message.location().url}`.trim());
});
page.on("pageerror", error => browserErrors.push(`pageerror: ${error.message}`));

await page.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });

const initialTimelineTime = await page.locator(".event-list time").first().textContent();
const initialEventCount = await page.locator(".event-list .event").count();

await page.getByLabel("目標距離").fill("38");
await page.waitForTimeout(250);
const criticalVisible = await page.getByText("CRITICAL", { exact: true }).first().isVisible();
const criticalEventVisible = await page.getByText("危急狀態啟動", { exact: true }).isVisible();

await page.getByRole("button", { name: "Trigger Offline", exact: true }).click();
const offlineVisible = await page.getByText("OFFLINE", { exact: true }).first().isVisible();
await page.getByRole("button", { name: "Restore Online", exact: true }).click();

await page.getByRole("button", { name: "Tamper Suspected", exact: true }).click();
const suspectedVisible = await page.locator(".event-list").getByText("疑似拆卸裝置", { exact: true }).isVisible();
await page.getByRole("button", { name: "Tamper Confirmed", exact: true }).click();
const confirmedVisible = await page.locator(".event-list").getByText("確認防拆事件", { exact: true }).isVisible();

await page.getByRole("button", { name: "Silent Notify", exact: true }).click();
await page.getByRole("button", { name: "One-Tap Help", exact: true }).click();
const helpEventVisible = await page.locator(".event-list").getByText("一鍵求助已啟動", { exact: true }).isVisible();

await page.getByRole("button", { name: "重置", exact: true }).click();
await page.getByRole("button", { name: /Auto Demo/ }).click();
await page.waitForTimeout(6100);
const awarenessVisible = await page.getByText("AWARENESS", { exact: true }).first().isVisible();
await page.getByRole("button", { name: /暫停/ }).click();
const pausedLabel = await page.locator(".control.primary em").textContent();
await page.waitForTimeout(1300);
const pausedStable = pausedLabel === await page.locator(".control.primary em").textContent();
await page.getByRole("button", { name: /繼續/ }).click();
await page.waitForTimeout(1200);
const resumed = pausedLabel !== await page.locator(".control.primary em").textContent();

const viewportIntegrity = await page.evaluate(() => ({
  innerWidth: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  consoleVisible: Boolean(document.querySelector(".console-panel"))
}));

await page.screenshot({ path: "artifacts/boundaryflow-phase2-1440.png", fullPage: true });
await browser.close();

const result = {
  hydrationStableInitialTime: initialTimelineTime === "18:30:34",
  initialEventCount,
  criticalVisible,
  criticalEventVisible,
  offlineVisible,
  suspectedVisible,
  confirmedVisible,
  helpEventVisible,
  awarenessVisible,
  pausedStable,
  resumed,
  viewportIntegrity,
  browserErrors
};

console.log(JSON.stringify(result, null, 2));
if (browserErrors.length || Object.entries(result).some(([key, value]) => typeof value === "boolean" && !value)) process.exitCode = 1;
