const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");
let browser;
before(async () => { browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) }); });
after(async () => { await browser?.close(); });

async function application(t, preferences = {}) {
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.route("**/*", route => route.fulfill({ contentType: "text/html", body: '<main id="spa-content"></main><div id="spa-loader"></div><div id="component"></div>' }));
  await page.goto("https://example.test/app/known?q=a?b");
  await initializePage(page, preferences);
  return page;
}

async function initializePage(page, preferences = {}) {
  await page.evaluate(preferences => { for (const [key, value] of Object.entries(preferences)) localStorage.setItem(key, value); }, preferences);
  const bootstrap = execFileSync(process.env.PHP_BINARY || "php", [path.join(__dirname, "render_init.php")], { encoding: "utf8" });
  for (const script of bootstrap.matchAll(/<script>([\s\S]*?)<\/script>/g)) await page.addScriptTag({ content: script[1] });
  await page.addScriptTag({ path: path.join(__dirname, "../js/jquery.min.js") });
  await page.addScriptTag({ path: path.join(__dirname, "../_functions.js") });
  await page.evaluate(() => {
    const values = { HOME_PATH: "https://example.test/app", URL: location.pathname.slice(4) + location.search, ROUTES: JSON.stringify({ "/known": { URI: "/known.php" } }) };
    for (const [key, value] of Object.entries(values)) byStorage.setItem(key, value);
    window.events = [];
    window.requests = [];
    window.remote_file_exists = () => $.Deferred().resolve(true).promise();
    for (const type of ["bySPA:before-unload", "bySPA:load", "bySPA:error"]) document.addEventListener(type, event => events.push({ type, ...event.detail }));
    $.ajax = options => {
      requests.push(options);
      const pending = $.Deferred();
      setTimeout(() => {
        if (options.url.includes("fail.php") || (window.errorFails && options.url.includes("_error.php"))) pending.reject({ status: 500 }, "error", "fixture failure");
        else pending.resolve(options.url.includes("_error.php") ? "<html><body>Error fixture</body></html>" : "<p>Fragment</p>");
      }, options.url.includes("slow.php") ? 100 : 0);
      return pending.promise();
    };
  });
  await page.addScriptTag({ path: path.join(__dirname, "../_common.js") });
  await page.addScriptTag({ path: path.join(__dirname, "../_spa.js") });
  await page.waitForFunction(() => events.some(event => event.type === "bySPA:load"));
  return page;
}

test("component transport preserves existing queries and helper precedence", async t => {
  const page = await application(t);
  for (const file of ["/part.php?fixed=1&repeat=a&repeat=b", "/part.php"]) {
    const url = await page.evaluate(async file => {
      await bySPA.reloadComponent("#component", file, { added: "x", repeat: "new" });
      return requests.at(-1).url;
    }, file);
    assert.equal(url, "https://example.test/app/part.php?" + (file.includes("?") ? "fixed=1&repeat=new&added=x" : "added=x&repeat=new") + "&uri=false");
  }
});
