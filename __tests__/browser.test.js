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

test("local HTML and CSRF utilities work without jQuery or SPA initialization", async (t) => {
  const page = await browser.newPage();
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

test("demo sidebar keeps its logo inside the header when collapsed and expanded", async (t) => {
  const page = await browser.newPage({ viewport: { width: 400, height: 320 } });
  t.after(() => page.close());
  const markup = execFileSync(process.env.PHP_BINARY || "php", ["sidebar.php"], { cwd: path.join(__dirname, "../demo"), encoding: "utf8" });
  await page.setContent(`<!doctype html><html class="no-motion"><body>${markup}</body></html>`);
  for (const file of ["css/bootstrap.min.css", "_common.css"]) await page.addStyleTag({ path: path.join(__dirname, "..", file) });
  for (const width of [400, 1280]) {
    await page.setViewportSize({ width, height: 320 });
    for (const expanded of [false, true]) {
      await page.locator("#bywr-sidebar").evaluate((element, expanded) => element.classList.toggle("bywr-sidebar-expanded", expanded), expanded);
      const header = await page.locator(".bywr-sidebar-header").boundingBox();
      const logo = await page.locator(".bywr-sidebar-header .navbar-brand").boundingBox();
      assert.ok(logo.y >= header.y && logo.y + logo.height <= header.y + header.height, `${width}px, expanded=${expanded}: header contains its logo`);
    }
  }
});

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

test("local lifecycle listeners hand navigation ownership to their recovery route", { skip: Boolean(reference) }, async (t) => {
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

test("Select2 arrow navigation commits single values, honors cancellation, and preserves hover and multiple selection", async (t) => {
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.route('https://select2.test/**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><head></head><body></body>' }));
  await page.goto('https://select2.test/');
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent('<select id="single"><option value="a">Alpha</option><optgroup label="Other"><option value="disabled" disabled>Disabled</option><option value="b">Beta</option><option value="c">Gamma</option></optgroup></select><select id="multiple" multiple><option value="a" selected>Alpha</option><option value="b">Beta</option></select>');
  await page.addStyleTag({ path: path.join(__dirname, "..", "css/select2.min.css") });
  // Shared keyboard behavior also applies when Select2 is loaded after common UI.
  for (const file of ["js/jquery.min.js", "_common.js", "js/select2.full.min.js"]) {
    await page.addScriptTag({ content: source(file) });
    if (file === "_common.js") await page.evaluate(async () => {
      byCommon.init();
      await new Promise((resolve) => $(resolve));
    });
  }
  await page.evaluate(() => {
    window.changes = [];
    $("select").select2({ width: "200px" }).on("input change select2:select", (event) => changes.push([event.target.id, event.type, event.target.value]));
  });
  const single = page.locator("#single");
  const selection = page.locator("#single + .select2 .select2-selection");
  await selection.click();
  await page.getByRole("option", { name: "Gamma", exact: true }).hover();
  assert.equal(await single.inputValue(), "a", "Mouse hover only highlights");
  await page.keyboard.press("Escape");
  await selection.click();
  await page.keyboard.press("ArrowDown");
  assert.equal(await single.inputValue(), "b", "Arrow navigation selects the next enabled option");
  assert.match(await selection.textContent(), /Beta/);
  assert.equal(await page.evaluate(() => $("#single").data("select2").isOpen()), true);
  assert.deepEqual(await page.evaluate(() => changes), [["single", "input", "b"], ["single", "change", "b"], ["single", "select2:select", "b"]]);
  await page.evaluate(async () => {
    byCommon.init();
    byCommon.init();
    await new Promise((resolve) => $(resolve));
  });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  assert.equal(await single.inputValue(), "c");
  assert.equal(await page.evaluate(() => changes.length), 6, "Boundary keys do not emit another change");
  await page.keyboard.press("ArrowUp");
  await page.evaluate(() => $("#single").on("select2:selecting.cancelTest", (event) => { if (event.params.args.data.id === "a") event.preventDefault(); }));
  await page.keyboard.press("ArrowUp");
  assert.equal(await single.inputValue(), "b", "Selection cancellation preserves the accepted value");
  assert.equal(await page.evaluate(() => changes.length), 9);
  await page.evaluate(() => $("#single").off(".cancelTest"));
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  assert.equal(await single.inputValue(), "a");
  await page.getByRole("option", { name: "Gamma", exact: true }).click();
  assert.equal(await single.inputValue(), "c");
  assert.equal(await page.evaluate(() => $("#single").data("select2").isOpen()), false, "Mouse selection retains normal close behavior");
  await page.locator("#multiple + .select2 .select2-search__field").click();
  await page.keyboard.press("ArrowDown");
  assert.deepEqual(await page.locator("#multiple").evaluate((node) => [...node.selectedOptions].map((option) => option.value)), ["a"], "Multiple selection requires confirmation");
  await page.keyboard.press("Escape");
  // Reopening, repeated imports, and destroy/reinitialize must never multiply change events.
  for (let i = 0; i < 3; i++) { await selection.click(); await page.keyboard.press("Escape"); }
  await page.addScriptTag({ content: source("_common.js") });
  await page.evaluate(() => { $("#single").select2("destroy").select2({ width: "200px" }); changes.length = 0; });
  await selection.click();
  await page.keyboard.press("ArrowUp");
  assert.equal(await single.inputValue(), "b");
  assert.equal(await page.evaluate(() => changes.filter((event) => event[1] === "change").length), 1);
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    $("<select id='remote'></select>").appendTo("body").select2({
      ajax: { transport: (_, success) => success({ results: [{ id: "remote-a", text: "Remote Alpha" }, { id: "remote-b", text: "Remote Beta" }] }) }
    });
    $("#remote").select2("open");
  });
  await page.getByRole("option", { name: "Remote Alpha", exact: true }).waitFor();
  await page.keyboard.press("ArrowDown");
  assert.equal(await page.locator("#remote").inputValue(), "remote-b", "Late AJAX results become canonical native options");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => $("#remote").data("select2").isOpen()), false);
  await page.evaluate(() => {
    $("<select id='removed'><option value='a'>Alpha</option><option value='b'>Beta</option></select>").appendTo("body").select2()
      .on("change", function () { $(this).select2("destroy").remove(); }).select2("open");
  });
  await page.keyboard.press("ArrowDown");
  assert.equal(await page.locator("#removed").count(), 0, "Change handlers may remove the owning control");
  assert.deepEqual(errors, []);
});

test("duplicate runtime scripts preserve active navigation and bind handlers once", async (t) => {
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
