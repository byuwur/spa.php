const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium, firefox, webkit } = require("playwright");
const engine = process.env.BROWSER_ENGINE || "chromium";
assert.ok(["chromium", "firefox", "webkit"].includes(engine), "Unsupported BROWSER_ENGINE");
const browserType = { chromium, firefox, webkit }[engine];
const launchOptions = { timeout: 10000, ...(engine === "chromium" ? { channel: process.env.BROWSER_CHANNEL || process.env.PLAYWRIGHT_CHANNEL, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) };
const { source, reference } = require("./parity-source");
let browser;
before(async () => {
  browser = await browserType.launch(launchOptions);
});
after(async () => {
  await browser?.close();
});

test("local URL helpers work without jQuery or SPA initialization", { timeout: 30000 }, async (t) => {
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  t.after(() => page.close());
  await page.addScriptTag({ path: path.join(__dirname, "../_functions.js") });
  const result = await page.evaluate(async () => {
    const text = JSON.stringify([{ platform: "twitch", handle: "/byUwUr 😀" }]);
    const token = await compress_url_data(text);
    let limited = false;
    try {
      await decompress_url_data(token, 1);
    } catch (error) {
      limited = error instanceof RangeError;
    }
    return {
      roundTrip: (await decompress_url_data(new URLSearchParams({ data: token }).get("data"))) === text,
      urlSafe: /^[A-Za-z0-9_-]+$/.test(token),
      limited,
      standalone: typeof jQuery === "undefined" && typeof bySPA === "undefined"
    };
  });
  assert.deepEqual(result, { roundTrip: true, urlSafe: true, limited: true, standalone: true });
});

test("local HTML and CSRF utilities work without jQuery or SPA initialization", { timeout: 30000 }, async (t) => {
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  t.after(() => page.close());
  await page.route("https://utilities.test/**", (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><head></head><body></body>" }));
  await page.goto("https://utilities.test/");
  await page.addScriptTag({ path: path.join(__dirname, "../_functions.js") });
  const result = await page.evaluate(() => {
    const escaped = [escape_html('<img src=x onerror="alert(1)">&'), escape_html(null), escape_html(undefined), escape_html(0), escape_html(false), escape_html("Caf\u00e9 \u{1f600}")];
    sessionStorage.setItem("CSRF_TOKEN", "stored-token");
    const meta = document.createElement("meta");
    meta.name = "csrf-token";
    meta.content = "meta-token";
    document.head.append(meta);
    const preferred = get_csrf_token();
    const payload = [{ name: "message", value: "Hello" }];
    const sameArray = add_csrf_token(payload) === payload;
    add_csrf_token(payload);
    const explicit = [{ name: "_csrf", value: "explicit-token" }];
    add_csrf_token(explicit);
    const readOnly = add_csrf_token([], "get");
    meta.content = "";
    const fallback = get_csrf_token();
    meta.remove();
    sessionStorage.removeItem("CSRF_TOKEN");
    return { escaped, preferred, fallback, missing: get_csrf_token(), payload, explicit, readOnly, sameArray, standalone: typeof jQuery === "undefined" && typeof bySPA === "undefined" };
  });
  assert.deepEqual(result, {
    escaped: ['&lt;img src=x onerror="alert(1)"&gt;&amp;', "", "", "0", "false", "Caf\u00e9 \u{1f600}"],
    preferred: "meta-token",
    fallback: "stored-token",
    missing: "",
    payload: [
      { name: "message", value: "Hello" },
      { name: "_csrf", value: "meta-token" }
    ],
    explicit: [{ name: "_csrf", value: "explicit-token" }],
    readOnly: [],
    sameArray: true,
    standalone: true
  });
});

async function application(t, preferences = {}) {
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  t.after(() => page.close());
  await page.route("**/*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: /* HTML */ `<main id="spa-content"></main>
        <div id="spa-loader"></div>
        <div id="component"></div>
        <div id="section"></div>
        <form id="form"><button type="submit"></button></form>
        <form id="other"></form>`
    })
  );
  await page.goto("https://example.test/app/known?q=a?b");
  await initializePage(page, preferences);
  return page;
}

async function initializePage(page, preferences = {}) {
  await page.evaluate((preferences) => {
    for (const [key, value] of Object.entries(preferences)) localStorage.setItem(key, value);
  }, preferences);
  const bootstrap = reference ? null : execFileSync(process.env.PHP_BINARY || "php", [path.join(__dirname, "render_init.php")], { encoding: "utf8" });
  const scripts = reference ? [source("_init.js")] : [...bootstrap.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((script) => script[1]);
  for (const content of scripts) await page.addScriptTag({ content });
  await page.addScriptTag({ path: path.join(__dirname, "../js/jquery.min.js") });
  await page.addScriptTag({ content: source("_functions.js") });
  await page.evaluate(() => {
    const values = {
      ROUTER_MODE: "path",
      HOME_PATH: "https://example.test/app",
      URL: location.pathname.slice(4) + location.search,
      ROUTES: JSON.stringify({ "/known": { URI: "/known.php" }, "/next": { URI: "/next.php" }, "/slow": { URI: "/slow.php" }, "/fail": { URI: "/fail.php" }, "/file": { FILE: "file.pdf" } })
    };
    for (const [key, value] of Object.entries(values)) byStorage.setItem(key, value);
    window.events = [];
    window.requests = [];
    window.cookieconsent = {
      run: (options) => {
        window.consent = options;
      }
    };
    window.remote_file_exists = () => $.Deferred().resolve(true).promise();
    for (const type of ["bySPA:before-unload", "bySPA:load", "bySPA:error"]) document.addEventListener(type, (event) => events.push({ type, ...event.detail }));
    $.ajax = (options) => {
      requests.push(options);
      const pending = $.Deferred();
      setTimeout(
        () => {
          if (options.url.includes("fail.php") || (window.errorFails && /_error\.(php|html)/.test(options.url))) pending.reject({ status: 500 }, "error", "fixture failure");
          else
            pending.resolve(
              /_error\.(php|html)/.test(options.url)
                ? /* HTML */ `<html>
                    <body>
                      Error fixture
                    </body>
                  </html>`
                : /* HTML */ `<p>Fragment</p>`
            );
        },
        options.url.includes("slow.php") ? 100 : 0
      );
      return pending.promise();
    };
  });
  await page.addScriptTag({ content: source("_common.js") });
  await page.addScriptTag({ content: source("_spa.js") });
  await page.waitForFunction(() => events.some((event) => event.type === "bySPA:load"));
  return page;
}

test("shared: navigation has one terminal outcome, including stale work and error-page failure", { timeout: 30000 }, async (t) => {
  for (const [url, expected, errorFails] of [
    ["/next", "bySPA:load", false],
    ["/fail", "bySPA:error", false],
    ["/unknown", "bySPA:error", false],
    ["/unknown", "bySPA:error", true]
  ]) {
    await t.test(`${url}, error-page failure=${errorFails}`, async (t) => {
      const page = await application(t);
      const result = await page.evaluate(
        async ({ url, errorFails }) => {
          events.length = 0;
          window.errorFails = errorFails;
          await bySPA.load(url);
          return { events: window.events.map((event) => event.type), errors: requests.filter((request) => /_error\.(php|html)/.test(request.url)).length };
        },
        { url, errorFails }
      );
      assert.ok(result.errors <= 3, "default error fallback must be bounded by its three candidates");
      assert.deepEqual(result.events, ["bySPA:before-unload", expected]);
    });
  }
  const page = await application(t);
  const events = await page.evaluate(async () => {
    events.length = 0;
    await Promise.all([bySPA.load("/slow"), bySPA.load("/next")]);
    return window.events.map((event) => [event.type, event.url]);
  });
  assert.deepEqual(events, [
    ["bySPA:before-unload", "/slow"],
    ["bySPA:before-unload", "/next"],
    ["bySPA:load", "/next"]
  ]);
});

test("local lifecycle listeners hand navigation ownership to their recovery route", { timeout: 30000, skip: Boolean(reference) }, async (t) => {
  for (const stage of ["before-unload", "error", "transport-error"]) {
    await t.test(stage, async (t) => {
      const page = await application(t);
      const result = await page.evaluate(async (stage) => {
        events.length = requests.length = 0;
        let recovery;
        let finishRecovery;
        let probes = 0;
        window.remote_file_exists = () => {
          probes++;
          return $.Deferred().resolve(true).promise();
        };
        const ajax = $.ajax;
        $.ajax = (options) => {
          if (options.url.includes("next.php")) {
            requests.push(options);
            const pending = $.Deferred();
            finishRecovery = () => pending.resolve("<p>Recovery</p>");
            return pending.promise();
          }
          if (stage === "transport-error" && options.url.includes("known.php")) return $.Deferred().reject({ status: 503, responseText: "Old error" }, "error", "unavailable").promise();
          return ajax(options);
        };
        document.addEventListener(
          stage === "before-unload" ? "bySPA:before-unload" : "bySPA:error",
          () => {
            recovery = bySPA.load("/next");
          },
          { once: true }
        );
        await bySPA.load(stage === "transport-error" ? "/known" : "/unknown");
        const pendingHTML = document.getElementById("spa-content")?.innerHTML;
        finishRecovery();
        await recovery;
        return { events: events.map((event) => event.type), requests: requests.map((request) => request.url), pendingHTML, probes, html: document.getElementById("spa-content")?.innerHTML, url: bySPA.URL };
      }, stage);
      assert.equal(result.pendingHTML, "");
      assert.equal(result.probes, 0);
      assert.equal(result.html, "<p>Recovery</p>");
      assert.equal(result.url, "/next");
      assert.equal(result.requests.length, 1);
      assert.ok(result.requests[0].includes("next.php"));
      assert.deepEqual(result.events, stage === "before-unload" ? ["bySPA:before-unload", "bySPA:before-unload", "bySPA:load"] : ["bySPA:before-unload", "bySPA:error", "bySPA:before-unload", "bySPA:load"]);
    });
  }
});

test("duplicate runtime scripts preserve active navigation and bind handlers once", { timeout: 30000 }, async (t) => {
  const page = await application(t);

  await page.evaluate(() => {
    window.savedRuntime = { load: bySPA.load, common: byCommon.init, memory: byStorage.memory, navigation: bySPA.NAVIGATION_ID, history: bySPA.HISTORY_INDEX, requests: requests.length, events: events.length };
  });
  for (const file of ["_common.js", "_spa.js"]) await page.addScriptTag({ content: source(file) });
  assert.equal(await page.evaluate(() => bySPA.initialized === true && byCommon.initialized === true), true);
  assert.deepEqual(
    await page.evaluate(() => ({
      sameLoad: bySPA.load === savedRuntime.load,
      sameCommon: byCommon.init === savedRuntime.common,
      sameMemory: byStorage.memory === savedRuntime.memory,
      sameNavigation: bySPA.NAVIGATION_ID === savedRuntime.navigation,
      sameHistory: bySPA.HISTORY_INDEX === savedRuntime.history,
      sameRequests: requests.length === savedRuntime.requests,
      sameEvents: events.length === savedRuntime.events
    })),
    { sameLoad: true, sameCommon: true, sameMemory: true, sameNavigation: true, sameHistory: true, sameRequests: true, sameEvents: true }
  );
  await page.evaluate(() => {
    const link = document.createElement("a");
    link.href = "/app/known";
    link.textContent = "Known route";
    document.body.append(link);
    link.click();
  });
  await page.waitForFunction(() => events.length > savedRuntime.events && events.at(-1).type === "bySPA:load");
  assert.equal(await page.evaluate(() => requests.length - savedRuntime.requests), 1);
});
