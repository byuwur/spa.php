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
  await page.route("**/*", route => route.fulfill({ contentType: "text/html", body: '<main id="spa-content"></main><div id="spa-loader"></div><div id="component"></div><form id="form"><button type="submit"></button></form><form id="other"></form>' }));
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
    window.cookieconsent = { run: options => { window.consent = options; } };
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

test("initial and later query entry points preserve complete suffixes", async t => {
  const page = await application(t);
  assert.equal(await page.evaluate(() => requests[0].url.includes("q=a%3Fb")), true);
  for (const query of ["q=a?b", "q=a%3Fb", "q=first&q=last", "q=%ZZ", "", "q="]) {
    const actual = await page.evaluate(async query => {
      await bySPA.load("/known?" + query, { push: false });
      return bySPA._GET.q ?? null;
    }, query);
    assert.equal(actual, Object.fromEntries(new URLSearchParams(query)).q ?? null);
  }
  const result = await page.evaluate(async () => {
    history.replaceState({}, "", "/app/known#/known?q=a?b");
    return get_url_param("q");
  });
  assert.equal(result, "a?b");
});

test("request rebinding preserves real jQuery consumer events and independent elements", async t => {
  const page = await application(t);
  const result = await page.evaluate(async () => {
    let consumer = 0;
    $("#form").on("submit.consumer change.consumer", () => consumer++);
    const options = { $elementId: "#form", $url: "/request", $trigger: "submit change" };
    element_make_http_request(options);
    element_make_http_request(options);
    element_make_http_request({ $elementId: "#other", $url: "/other-change", $trigger: "change" });
    element_make_http_request({ $elementId: "#other", $url: "/other" });
    const count = requests.length;
    for (const [id, type] of [["form", "submit"], ["form", "change"], ["other", "submit"], ["other", "change"]]) document.getElementById(id).dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
    return { consumer, count: requests.length - count };
  });
  assert.deepEqual(result, { consumer: 2, count: 4 });
});

test("consent consumes namespaced preferences and retains defaults", async t => {
  const page = await application(t);
  assert.deepEqual(await page.evaluate(() => [consent.palette, consent.language]), ["dark", "es"]);
  const migrated = await application(t, { APP_THEME: "light", APP_LANG: "en" });
  assert.deepEqual(await migrated.evaluate(() => [consent.palette, consent.language, localStorage.getItem("APP_THEME")]), ["light", "en", null]);
});
