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
  await page.route("**/*", route => route.fulfill({ contentType: "text/html", body: '<main id="spa-content"></main><div id="spa-loader"></div><div id="component"></div><div id="section"></div><form id="form"><button type="submit"></button></form><form id="other"></form>' }));
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
    const values = { HOME_PATH: "https://example.test/app", URL: location.pathname.slice(4) + location.search, ROUTES: JSON.stringify({ "/known": { URI: "/known.php" }, "/next": { URI: "/next.php" }, "/slow": { URI: "/slow.php" }, "/fail": { URI: "/fail.php" }, "/file": { FILE: "file.pdf" } }) };
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

test("navigation has one terminal outcome, including stale work and error-page failure", async t => {
  for (const [url, expected] of [["/next", "bySPA:load"], ["/fail", "bySPA:error"], ["/unknown", "bySPA:error"]]) {
    const page = await application(t);
    const events = await page.evaluate(async url => {
      events.length = 0;
      window.errorFails = true;
      await bySPA.load(url);
      return window.events.map(event => event.type);
    }, url);
    assert.deepEqual(events, ["bySPA:before-unload", expected]);
  }
  const page = await application(t);
  const events = await page.evaluate(async () => {
    events.length = 0;
    await Promise.all([bySPA.load("/slow"), bySPA.load("/next")]);
    return window.events.map(event => [event.type, event.url]);
  });
  assert.deepEqual(events, [["bySPA:before-unload", "/slow"], ["bySPA:before-unload", "/next"], ["bySPA:load", "/next"]]);
});

test("both click handlers preserve native ownership and existing-target scrolling", async t => {
  const page = await application(t);
  const cases = [
    ["https://elsewhere.test/page#section", {}, false], ["/sibling/page#section", {}, false],
    ["/application/page", {}, false], ["#missing", {}, false], ["#section", {}, true],
    ["#/next", {}, false], ["/app/next", {}, true], ["/app/next", { ctrlKey: true }, false],
    ["/app/next", { button: 1 }, false], ["/app/next", { target: "named" }, false],
    ["/app/next", { download: "file" }, false], ["/app/next#section", {}, false]
  ];
  for (const [href, options, expected] of cases) {
    const prevented = await page.evaluate(async ({ href, options }) => {
      history.replaceState({}, "", "/app/known?q=a?b");
      const a = document.createElement("a");
      a.href = href;
      if (options.target) a.target = options.target;
      if (options.download) a.download = options.download;
      document.body.append(a);
      byCommon.init();
      await new Promise(resolve => $(resolve));
      let intercepted;
      // Observe after jQuery's delegated handler, then suppress native navigation for this matrix.
      const observe = event => { intercepted = event.defaultPrevented; event.preventDefault(); };
      document.addEventListener("click", observe, { once: true });
      a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...options }));
      a.remove();
      return intercepted;
    }, { href, options });
    assert.equal(prevented, expected, href + JSON.stringify(options));
  }
});

test("native external hash navigation reaches the destination", async t => {
  const page = await application(t);
  await page.evaluate(() => { document.body.insertAdjacentHTML("beforeend", '<a id="external" href="https://elsewhere.test/page#section">External</a>'); byCommon.init(); });
  await page.click("#external");
  await page.waitForURL("https://elsewhere.test/page#section");
});

test("rapid navigation, error, Back, FILE, Back returns to a clean application", async t => {
  const page = await application(t);
  await page.evaluate(async () => { await Promise.all([bySPA.load("/slow"), bySPA.load("/next")]); });
  const navigationAttempts = [];
  await page.exposeFunction("reportNavigation", url => navigationAttempts.push(url));
  await page.evaluate(async () => {
    document.addEventListener("bySPA:before-unload", event => reportNavigation(event.detail.url));
    await bySPA.load("/unknown");
  });
  assert.equal(await page.locator("body").innerText(), "Error fixture");
  await page.goBack();
  await page.waitForFunction(() => typeof bySPA === "undefined");
  assert.equal(new URL(page.url()).pathname, "/app/next");
  assert.deepEqual(navigationAttempts, ["/unknown"]);
  // The fixture server supplies the shell; execute its real bootstrap after the native reload.
  await initializePage(page);
  await page.evaluate(() => { bySPA.load("/file"); });
  await page.waitForURL("https://example.test/app/file");
  await page.goBack();
  await page.waitForURL("https://example.test/app/next");
  await page.waitForFunction(() => typeof bySPA === "undefined");
  await initializePage(page);
  assert.equal(await page.evaluate(() => events.filter(event => event.type === "bySPA:load").length), 1);
});
