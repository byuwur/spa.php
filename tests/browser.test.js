const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");
const { source, reference } = require("./parity-source");
let browser;
before(async () => {
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
});
after(async () => {
  await browser?.close();
});

test("local URL helpers work without jQuery or SPA initialization", async (t) => {
  const page = await browser.newPage();
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

async function application(t, preferences = {}) {
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.route("**/*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: /* HTML */ `<main id="spa-content"></main><div id="spa-loader"></div><div id="component"></div><div id="section"></div><form id="form"><button type="submit"></button></form><form id="other"></form>`
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
                ? /* HTML */ `<html
                    ><body
                      >Error fixture</body
                    ></html
                  >`
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

test("accessibility text scales inherited text, headings, and Bootstrap utilities together", async (t) => {
  const page = await application(t);
  await page.addStyleTag({ path: path.join(__dirname, "../css/bootstrap.min.css") });
  await page.addStyleTag({ path: path.join(__dirname, "../_common.css") });
  await page.evaluate(() => {
    document.getElementById("spa-content").innerHTML = `<p>Inherited text</p>${[1, 2, 3, 4, 5, 6].map((level) => `<h${level}>Heading</h${level}><span class="fs-${level}">Utility</span>`).join("")}`;
  });
  const sizes = () => page.locator("#spa-content > *").evaluateAll((elements) => elements.map((element) => parseFloat(getComputedStyle(element).fontSize)));
  const baseline = await sizes();
  assert.equal(baseline[0], 16);
  for (const [mode, scale] of [
    ["plus", 1.25],
    ["plus", 1.5],
    ["minus", 1.25],
    ["", 1],
    ["minus", 0.75],
    ["", 1]
  ]) {
    await page.evaluate((mode) => byCommon.accessibilityText(mode), mode);
    const actual = await sizes();
    actual.forEach((size, index) => assert.ok(Math.abs(size - baseline[index] * scale) < 0.01, `Element ${index}: ${mode} scales text once`));
  }
  assert.equal(await page.evaluate(() => document.body.style.fontSize), "");
});

test("component transport preserves existing queries and helper precedence", async (t) => {
  const page = await application(t);
  for (const file of ["/part.php?fixed=1&repeat=a&repeat=b", "/part.php"]) {
    const url = await page.evaluate(async (file) => {
      await bySPA.reloadComponent("#component", file, { added: "x", repeat: "new" });
      return requests.at(-1).url;
    }, file);
    assert.equal(url, `https://example.test/app/part.php?${file.includes("?") ? "fixed=1&repeat=new&added=x" : "added=x&repeat=new"}&uri=false`);
  }
});

test("shared: initial and later query entry points preserve complete suffixes", async (t) => {
  const page = await application(t);
  assert.equal(await page.evaluate(() => requests[0].url.includes("q=a%3Fb")), true);
  for (const query of ["q=a?b", "q=a%3Fb", "q=first&q=last", "q=%ZZ", "", "q="]) {
    const actual = await page.evaluate(async (query) => {
      await bySPA.load(`/known?${query}`, { push: false });
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

test("shared: request rebinding preserves real jQuery consumer events and independent elements", async (t) => {
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
    for (const [id, type] of [
      ["form", "submit"],
      ["form", "change"],
      ["other", "submit"],
      ["other", "change"]
    ])
      document.getElementById(id).dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
    return { consumer, count: requests.length - count };
  });
  assert.deepEqual(result, { consumer: 2, count: 4 });
});

test("shared: consent consumes namespaced preferences and retains defaults", async (t) => {
  const page = await application(t);
  assert.deepEqual(await page.evaluate(() => [consent.palette, consent.language]), ["dark", "es"]);
  const migrated = await application(t, { APP_THEME: "light", APP_LANG: "en" });
  assert.deepEqual(await migrated.evaluate(() => [consent.palette, consent.language, localStorage.getItem("APP_THEME")]), ["light", "en", null]);
});

test("shared: navigation has one terminal outcome, including stale work and error-page failure", async (t) => {
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

test("shared: both click handlers preserve native ownership and existing-target scrolling", async (t) => {
  const page = await application(t);
  const cases = [
    ["https://elsewhere.test/page#section", {}, false],
    ["/sibling/page#section", {}, false],
    ["#missing", {}, false],
    ["#section", {}, true],
    ["#/next", {}, Boolean(reference)],
    ["/app/next", { target: "_self" }, Boolean(reference)],
    ["/app/next", {}, true],
    ["/app/next", { ctrlKey: true }, false],
    ["/app/next", { button: 1 }, false],
    ["/app/next", { target: "named" }, false],
    ["/app/next", { download: "file" }, false],
    ["/app/next#section", {}, false]
  ];
  for (const [href, options, expected] of cases) {
    const prevented = await page.evaluate(
      async ({ href, options }) => {
        history.replaceState({}, "", "/app/known?q=a?b");
        const a = document.createElement("a");
        a.href = href;
        if (options.target) a.target = options.target;
        if (options.download) a.download = options.download;
        document.body.append(a);
        byCommon.init();
        await new Promise((resolve) => $(resolve));
        let intercepted;
        // Observe after jQuery's delegated handler, then suppress native navigation for this matrix.
        const observe = (event) => {
          intercepted = event.defaultPrevented;
          event.preventDefault();
        };
        document.addEventListener("click", observe, { once: true });
        a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...options }));
        a.remove();
        return intercepted;
      },
      { href, options }
    );
    assert.equal(prevented, expected, href + JSON.stringify(options));
  }
});

test("native external hash navigation reaches the destination", async (t) => {
  const page = await application(t);
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend", /* HTML */ `<a id="external" href="https://elsewhere.test/page#section">External</a>`);
    byCommon.init();
  });
  await page.click("#external");
  await page.waitForURL("https://elsewhere.test/page#section");
});

test("rapid navigation, error, Back, FILE, Back returns to a clean application", async (t) => {
  const page = await application(t);
  await page.evaluate(async () => {
    await Promise.all([bySPA.load("/slow"), bySPA.load("/next")]);
  });
  const navigationAttempts = [];
  await page.exposeFunction("reportNavigation", (url) => navigationAttempts.push(url));
  await page.evaluate(async () => {
    document.addEventListener("bySPA:before-unload", (event) => reportNavigation(event.detail.url));
    await bySPA.load("/unknown");
  });
  assert.equal(await page.locator("body").innerText(), "Error fixture");
  await page.goBack();
  await page.waitForFunction(() => typeof bySPA === "undefined");
  assert.equal(new URL(page.url()).pathname, "/app/next");
  assert.deepEqual(navigationAttempts, ["/unknown"]);
  // The fixture server supplies the shell; execute its real bootstrap after the native reload.
  await initializePage(page);
  await page.evaluate(() => {
    bySPA.load("/file");
  });
  await page.waitForURL("https://example.test/app/file");
  await page.goBack();
  await page.waitForURL("https://example.test/app/next");
  await page.waitForFunction(() => typeof bySPA === "undefined");
  await initializePage(page);
  assert.equal(await page.evaluate(() => events.filter((event) => event.type === "bySPA:load").length), 1);
});

test("PHP root-relative links retain virtual-route navigation and native opt-outs", { skip: Boolean(reference) }, async (t) => {
  const page = await application(t);
  for (const [href, attributes, expected] of [
    ["/next?q=a%3Fb", {}, "/next?q=a%3Fb"],
    ["/app/next?q=a%3Fb", {}, "/next?q=a%3Fb"],
    ["/missing", {}, "/missing"],
    ["/application/page", {}, "/application/page"],
    ["/next", { "custom-folder": "true" }, null],
    ["/next", { target: "_self" }, null],
    ["/next", { download: "sample" }, null],
    ["https://elsewhere.test/next", {}, null],
    ["/next#section", {}, null]
  ]) {
    const result = await page.evaluate(
      ({ href, attributes }) => {
        const a = document.createElement("a");
        a.href = href;
        for (const [key, value] of Object.entries(attributes)) a.setAttribute(key, value);
        document.body.append(a);
        const load = bySPA.load;
        let routed = null;
        bySPA.load = (url) => {
          routed = url;
        };
        document.addEventListener("click", (event) => event.preventDefault(), { once: true });
        a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
        bySPA.load = load;
        a.remove();
        return routed;
      },
      { href, attributes }
    );
    assert.equal(result, expected, href + JSON.stringify(attributes));
  }
});

test("component failures settle independently and navigation retains jQuery promise methods", async (t) => {
  const page = await application(t);
  const result = await page.evaluate(async () => {
    const unhandled = [];
    window.addEventListener("unhandledrejection", (event) => unhandled.push(event.reason?.message));
    events = [];
    bySPA.ROUTES["/known"].COMPONENT = { "#component": "/broken" };
    bySPA.reloadComponent = () => Promise.reject(new Error("Component fixture failure"));
    $.ajax = () => {
      const response = $.Deferred();
      setTimeout(() => response.resolve(/* HTML */ `<p>Page survives</p>`), 25);
      return response.promise();
    };
    const request = bySPA.load("/known", { push: false });
    const jqueryMethods = ["done", "fail", "always"].every((method) => typeof request[method] === "function");
    const html = await request;
    await new Promise((resolve) => setTimeout(resolve, 0));
    return { unhandled, jqueryMethods, html, events: events.map((event) => event.type) };
  });
  assert.deepEqual(result, {
    unhandled: [],
    jqueryMethods: true,
    html: "<p>Page survives</p>",
    events: ["bySPA:before-unload", "bySPA:load"]
  });
});

test("resource probes preserve HEAD fallback and jQuery promise compatibility", async (t) => {
  const page = await application(t);
  await page.addScriptTag({ content: source("_functions.js") });
  const result = await page.evaluate(async () => {
    const results = [];
    for (const [headStatus, getFails, expected] of [
      [200, false, true],
      [405, false, true],
      [501, true, false],
      [500, false, false]
    ]) {
      const methods = [];
      $.ajax = ({ type }) => {
        methods.push(type);
        const response = $.Deferred();
        if (type === "HEAD" && headStatus !== 200) response.reject({ status: headStatus });
        else if (type === "GET" && getFails) response.reject({ status: 404 });
        else response.resolve();
        return response.promise();
      };
      const request = remote_file_exists("/asset");
      results.push({
        actual: await request,
        expected,
        methods,
        jqueryMethods: ["done", "fail", "always"].every((method) => typeof request[method] === "function")
      });
    }
    const invalid = remote_file_exists("http://[");
    return { results, invalid: await invalid, invalidHasAlways: typeof invalid.always === "function" };
  });
  assert.deepEqual(
    result.results.map((item) => item.methods),
    [["HEAD"], ["HEAD", "GET"], ["HEAD", "GET"], ["HEAD"]]
  );
  for (const item of result.results) {
    assert.equal(item.actual, item.expected);
    assert.equal(item.jqueryMethods, true);
  }
  assert.equal(result.invalid, false);
  assert.equal(result.invalidHasAlways, true);
});
