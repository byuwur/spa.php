const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.join(__dirname, "..");
let browser;

before(async () => {
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
});
after(async () => {
  await browser?.close();
});

async function fontPage(t, markup) {
  const page = await browser.newPage();
  t.after(() => page.close());
  const requests = [],
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://example.test/**", (route) => {
    const url = new URL(route.request().url());
    if (/\.(woff2?|ttf)$/.test(url.pathname)) {
      const font = path.join(root, "css", "webfonts", path.basename(url.pathname));
      return route.fulfill({ body: fs.readFileSync(font), contentType: "application/octet-stream" });
    }
    return route.fulfill({ contentType: "text/html", body: markup });
  });
  // Isolate browser interaction from Google's availability; loader failures have separate tests.
  await page.route("https://fonts.googleapis.com/**", (route) => {
    requests.push(route.request().url());
    return route.fulfill({ contentType: "text/css", body: "/* Font request fixture */" });
  });
  await page.goto("https://example.test/app/");
  for (const file of ["css/bootstrap.min.css", "css/select2.min.css", "_common.css"]) await page.addStyleTag({ path: path.join(root, file) });
  for (const file of ["js/jquery.min.js", "js/select2.full.min.js", "js/popper.min.js", "js/bootstrap.min.js", "_fonts.js", "_common.js"]) await page.addScriptTag({ path: path.join(root, file) });
  return { page, requests, errors };
}

test("font cleanup preserves unrelated widgets", async (t) => {
  const { page, errors } = await fontPage(
    t,
    /* HTML */ ` <main id="spa-content"
      ><form id="settings">
        <label>Font <input id="font" data-font-picker value="Arial" /></label>
        <select id="ordinary"
          ><option>Ordinary</option></select
        >
      </form></main
    >`
  );
  await page.evaluate(() => {
    $("#ordinary").select2();
    window.ordinaryWidget = $("#ordinary").data("select2");
    byFont.init();
    byFont.init();
  });
  await page.locator("#font + .select2-container").click();
  await page.evaluate(() => {
    byFont.destroy(document.getElementById("settings"));
    byFont.destroy(document.getElementById("settings"));
  });
  assert.equal(await page.locator("#settings").count(), 1);
  assert.equal(await page.locator(".font-preview, .select2-dropdown").count(), 0);
  assert.equal(await page.evaluate(() => !!$("#font").data("select2")), false);
  assert.equal(await page.evaluate(() => $("#ordinary").data("select2") === ordinaryWidget), true);
  await page.evaluate(() => byFont.init());
  assert.equal(await page.locator(".font-preview").count(), 1);
  assert.deepEqual(errors, []);
});
