const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const loader = path.join(__dirname, "../_load.js");
const launchOptions = { channel: process.env.BROWSER_CHANNEL || undefined, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined };

test("loader waits for parsing, preserves script/CSS order and UTF-8, and shares duplicate requests", async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage();
    const requests = [];
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      requests.push(url.pathname);
      if (url.pathname === "/_load.js") return route.fulfill({ path: loader, contentType: "text/javascript" });
      if (url.pathname === "/lib/one.js") {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return route.fulfill({ contentType: "text/javascript", body: 'window.order = ["one"]; window.accent = "Hágale pues — 日本語 🎮"; window.parsed = !!document.getElementById("parsed");' });
      }
      if (url.pathname === "/lib/two.js") return route.fulfill({ contentType: "text/javascript", body: 'window.order.push("two");' });
      if (url.pathname === "/lib/base.css") return route.fulfill({ contentType: "text/css", body: ".probe { color: #ff0000; }" });
      return route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><head><meta charset="UTF-8"><script src="/_load.js"></script>
          <script id="anchor">
            window.onload = () => { window.hostLoaded = true; };
            window.loaded = byLoad(["/base.css?theme=dark", "/one.js?v=1#test", "/two.js"], { host: "https://load.test/lib", before: document.getElementById("anchor") });
          </script><style>.probe { color: #00ff00; }</style></head><body><p id="parsed" class="probe">Ready</p></body>`
      });
    });
    await page.goto("https://load.test/app/index.html");
    await page.evaluate(() => loaded);
    assert.deepEqual(await page.evaluate(() => order), ["one", "two"]);
    assert.equal(await page.evaluate(() => accent), "Hágale pues — 日本語 🎮");
    assert.equal(await page.evaluate(() => parsed && hostLoaded), true);
    assert.equal(await page.locator(".probe").evaluate((node) => getComputedStyle(node).color), "rgb(0, 255, 0)");
    await page.evaluate(() => Promise.all([byLoad(["https://load.test/lib/one.js?v=1#test"]), byLoad(["https://load.test/lib/one.js?v=1#test"])]));
    assert.equal(requests.filter((url) => url === "/lib/one.js").length, 1);
    await page.evaluate(() => byLoad(["https://load.test/_load.js"]));
    await page.evaluate(() => byLoad(["https://load.test/lib/two.js"]));
    assert.deepEqual(await page.evaluate(() => order), ["one", "two"], "Repeated loader imports retain the request registry");
  } finally {
    await browser.close();
  }
});

test("loader rejects required failures, permits retry, and continues after optional failures", async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage();
    let attempts = 0;
    const requests = [];
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      requests.push(url.pathname);
      if (url.pathname === "/retry.js") return route.fulfill({ status: ++attempts === 1 ? 404 : 200, contentType: "text/javascript", body: "window.retried = true;" });
      if (url.pathname === "/missing.css") return route.fulfill({ status: 404, body: "missing" });
      if (url.pathname === "/after.js") return route.fulfill({ contentType: "text/javascript", body: "window.attribute = document.currentScript.dataset.test;" });
      if (url.pathname === "/_load.js") return route.fulfill({ path: loader, contentType: "text/javascript" });
      return route.fulfill({ contentType: "text/html", body: '<!doctype html><meta charset="UTF-8"><script src="/_load.js"></script>' });
    });
    await page.goto("https://load.test/");
    assert.match(await page.evaluate(() => byLoad(["/retry.js", "/after.js"]).catch((error) => error.message)), /retry\.js/);
    assert.equal(requests.includes("/after.js"), false);
    assert.equal(await page.locator('script[src$="retry.js"]').count(), 0);
    await page.evaluate(() => byLoad(["/retry.js"]));
    assert.equal(await page.evaluate(() => retried), true);
    assert.equal(attempts, 2);
    assert.deepEqual(await page.evaluate(async () => (await byLoad([{ path: "/missing.css", optional: true }, { path: "/after.js", attributes: { "data-test": "preserved" } }])).map((node) => node?.tagName || null)), [null, "SCRIPT"]);
    assert.equal(await page.evaluate(() => attribute), "preserved");
    assert.match(await page.evaluate(() => byLoad(["/unknown.json"]).catch((error) => error.message)), /Unsupported dependency/);
    assert.match(await page.evaluate(() => byLoad([{ path: "/module.js", attributes: { type: "module" } }]).catch((error) => error.message)), /classic scripts/);
  } finally {
    await browser.close();
  }
});

test("loader supports downloaded files and calls made after DOMContentLoaded", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "spa-load-"));
  const browser = await chromium.launch(launchOptions);
  try {
    await fs.copyFile(loader, path.join(directory, "_load.js"));
    await fs.writeFile(path.join(directory, "one.js"), 'window.localText = "Hágale pues";');
    await fs.writeFile(path.join(directory, "base.css"), "body { --loaded: yes; }");
    await fs.writeFile(path.join(directory, "index.html"), '<!doctype html><meta charset="UTF-8"><script src="./_load.js" defer></script><body>Local</body>');
    const page = await browser.newPage();
    await page.goto(pathToFileURL(path.join(directory, "index.html")).href);
    await page.evaluate(() => byLoad(["./base.css", "./one.js"]));
    assert.equal(await page.evaluate(() => localText), "Hágale pues");
    assert.equal(await page.locator("body").evaluate((node) => getComputedStyle(node).getPropertyValue("--loaded").trim()), "yes");
  } finally {
    await browser.close();
    assert.equal(path.dirname(directory), os.tmpdir());
    await fs.rm(directory, { recursive: true, force: true });
  }
});
