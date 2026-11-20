const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");
const { chromium, firefox, webkit } = require("playwright");
const engine = process.env.BROWSER_ENGINE || "chromium";
assert.ok(["chromium", "firefox", "webkit"].includes(engine), "Unsupported BROWSER_ENGINE");
const browserType = { chromium, firefox, webkit }[engine];
const launchOptions = {
  timeout: 10000,
  ...(engine === "chromium"
    ? {
        channel: process.env.BROWSER_CHANNEL || process.env.PLAYWRIGHT_CHANNEL,
        executablePath: process.env.CHROMIUM_EXECUTABLE_PATH
      }
    : {})
};

const root = path.join(__dirname, "..");
let browser;
test.before(async () => {
  browser = await browserType.launch(launchOptions);
});
test.after(async () => {
  await browser?.close();
});

// ===== TEST FIXTURES =====
/**
 * Open a page with local SPA transition assets and close it after the test.
 * @param {import("node:test").TestContext} t Test owning the page.
 * @param {boolean} [common=false] Load common CSS to check its transition import.
 * @returns {Promise<import("playwright").Page>} Browser page for this test.
 */
async function pageFor(t, common = false) {
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  t.after(() => page.close());
  await page.route("https://motion.test/**", async (route) => {
    const file = new URL(route.request().url()).pathname.slice(1);
    if (["_transitions.css", "_transitions.js", "_common.css", "_fonts.css"].includes(file)) {
      return route.fulfill({
        path: path.join(root, file),
        contentType: file.endsWith("css") ? "text/css" : "text/javascript"
      });
    }
    if (file.startsWith("css/webfonts/"))
      return route.fulfill({
        path: path.join(root, file),
        contentType: "application/octet-stream"
      });
    return route.fulfill({
      contentType: "text/html; charset=UTF-8",
      body: '<!doctype html><html><head><meta charset="UTF-8"><style>#panel { width: 16rem; line-height: 20px; overflow: auto; } #panel p { margin: 0; } #plain { height: 20px; }</style></head><body><div id="panel"><p>First line</p><button id="keep">Keep this node</button></div><div id="plain">Plain</div><div class="byCODEdocument"><span id="embedded">Code</span></div></body></html>'
    });
  });
  await page.goto("https://motion.test/");
  await page.addStyleTag({ url: `https://motion.test/${common ? "_common.css" : "_transitions.css"}` });
  await page.addScriptTag({ url: "https://motion.test/_transitions.js" });
  return page;
}

// ===== TRANSITIONS TESTS =====
test("explicit content changes preserve nodes, use host timing, and restore overflow", { timeout: 30000 }, async (t) => {
  const page = await pageFor(t);
  const result = await page.evaluate(async () => {
    document.documentElement.style.setProperty("--transition-duration", "80ms");
    const button = document.getElementById("keep");
    button.addEventListener("click", () => {
      window.clicks = (window.clicks || 0) + 1;
    });
    const animations = byTransition("#panel", (element) => element.append(Object.assign(document.createElement("p"), { textContent: "More content\nMore content" })));
    const animation = animations[0];
    const frames = animation.effect.getKeyframes();
    const { duration, easing } = animation.effect.getTiming();
    const clipped = getComputedStyle(document.getElementById("panel")).overflow === "hidden";
    await animation.finished;
    button.click();
    return {
      count: animations.length,
      duration,
      easing,
      clipped,
      grows: parseFloat(frames[1].height) > parseFloat(frames[0].height),
      sameNode: button === document.getElementById("keep"),
      clicks,
      overflow: document.getElementById("panel").style.overflow
    };
  });
  assert.deepEqual(result, {
    count: 1,
    duration: 80,
    easing: "ease",
    clipped: true,
    grows: true,
    sameNode: true,
    clicks: 1,
    overflow: ""
  });
});

test("watchers coalesce changes, share explicit updates, and disconnect without touching replacements", { timeout: 30000 }, async (t) => {
  const page = await pageFor(t);
  await page.evaluate(() => {
    window.effects = [];
    const panel = document.getElementById("panel");
    const animate = panel.animate.bind(panel);
    panel.animate = (...args) => {
      const effect = animate(...args);
      effects.push(effect);
      return effect;
    };
    window.watcher = byTransition.watch("#panel", { duration: 60 });
    panel.append(document.createElement("p"), document.createTextNode("New content"));
  });
  await page.waitForFunction(() => effects.length === 1);
  await page.evaluate(() => effects[0].finished);
  assert.equal(
    await page.evaluate(
      () =>
        byTransition(
          "#panel",
          (element) => {
            element.textContent = "Explicit change";
          },
          { duration: 90 }
        ).length
    ),
    0
  );
  await page.waitForFunction(() => effects.length === 2);
  assert.equal(await page.evaluate(() => effects[1].effect.getTiming().duration), 90);
  await page.evaluate(() => effects[1].finished);
  await page.evaluate(() => {
    watcher.disconnect();
    window.replacement = byTransition.watch("#panel", { duration: 40 });
    watcher.disconnect();
    document.getElementById("panel").textContent = "Replacement watcher";
  });
  await page.waitForFunction(() => effects.length === 3);
  await page.evaluate(() => effects[2].finished);
  await page.evaluate(() => {
    replacement.disconnect();
    document.getElementById("panel").textContent = "Disconnected";
  });
  await page.waitForTimeout(80);
  assert.equal(await page.evaluate(() => effects.length), 3);
});
