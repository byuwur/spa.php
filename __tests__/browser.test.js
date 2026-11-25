const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium, firefox, webkit } = require("playwright");
const engine = process.env.BROWSER_ENGINE || "chromium";
assert.ok(["chromium", "firefox", "webkit"].includes(engine), "Unsupported BROWSER_ENGINE");
const browserType = { chromium, firefox, webkit }[engine];
const launchOptions = {
  timeout: 30000,
  ...(engine === "chromium"
    ? {
        channel: process.env.BROWSER_CHANNEL || process.env.PLAYWRIGHT_CHANNEL,
        executablePath: process.env.CHROMIUM_EXECUTABLE_PATH
      }
    : {})
};
const { source, reference } = require("./parity-source");
let browser;
before(async () => {
  browser = await browserType.launch(launchOptions);
});
after(async () => {
  await browser?.close();
});

// ===== BROWSER TESTS =====
test("privacy links and buttons reopen one panel without changing consent or the current route", async (t) => {
  const page = await browser.newPage();
  t.after(() => page.close());
  const url = "https://privacy.test/page";
  await page.route(url, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<a href="#cookie-controls">Cookies</a><button data-target="#privacy-controls">Preferences</button>'
    })
  );
  await page.goto(url + "#privacy-controls");
  await page.addScriptTag({ path: path.join(__dirname, "../_privacy.js") });
  await page.evaluate(() => {
    window.choices = [];
    const controls = byCommon.initPrivacyControls({
      onChoice(value) {
        choices.push(value);
        controls.update(true, value);
      }
    });
    controls.update(true, "no");
    byCommon.initPrivacyControls();
  });
  const panel = page.locator("#privacy-controls");
  assert.equal(await panel.count(), 1);
  assert.ok(await panel.isVisible());
  await panel.getByRole("button", { name: "Close" }).click();
  await page.evaluate(() => history.replaceState(null, "", "#existing-route"));
  await page.getByRole("link", { name: "Cookies" }).click();
  assert.ok(await panel.isVisible());
  assert.equal(new URL(page.url()).hash, "#existing-route");
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => document.activeElement.textContent), "Cookies");
  await page.getByRole("button", { name: "Preferences" }).click();
  await panel.getByRole("button", { name: "Accept", exact: true }).click();
  assert.deepEqual(await page.evaluate(() => choices), ["yes"]);
  assert.equal(await panel.isVisible(), false);
  await page.evaluate(() => {
    const slot = document.createElement("div");
    slot.dataset.privacyInline = "on-load";
    document.body.prepend(slot);
    byCommon.initPrivacyControls().update(true, "yes");
  });
  assert.ok(await page.locator("[data-privacy-inline] #privacy-controls").isVisible());
  assert.equal(await panel.evaluate((el) => getComputedStyle(el).position), "static");
  await page.evaluate(() => byCommon.initPrivacyControls().update(false, "yes"));
  assert.ok(await panel.isVisible());
  assert.ok(await panel.locator("[data-close]").isVisible());
  await panel.locator("[data-close]").click();
  await page.evaluate(() => byCommon.initPrivacyControls().update(true, "yes"));
  assert.equal(await panel.isVisible(), false);
  await page.getByRole("button", { name: "Preferences" }).click();
  assert.ok(await panel.isVisible());
  await panel.getByRole("button", { name: "Reject", exact: true }).click();
  assert.equal(await panel.isVisible(), false);
  await page.evaluate(() => {
    const slot = document.querySelector("[data-privacy-inline]");
    slot.replaceWith(slot.cloneNode(false));
    byCommon.initPrivacyControls().update(true, "no");
  });
  assert.ok(await panel.isVisible());
  assert.equal(await panel.getByRole("status").textContent(), "You have rejected analytics.");
  assert.deepEqual(await page.evaluate(() => choices), ["yes", "no"]);
});

test("closing the themed banner persists across hosts without recording consent", async (t) => {
  const context = await browser.newContext();
  t.after(() => context.close());
  await context.route("https://*.example.test/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<html lang="en" data-bs-theme="light"><body><a href="#privacy-controls">Manage privacy</a></body></html>'
    })
  );
  const page = await context.newPage();
  async function mount(host) {
    await page.goto("https://" + host + ".example.test/");
    await page.addScriptTag({ path: path.join(__dirname, "../_privacy.js") });
    await page.evaluate(() => {
      window.choices = [];
      const controls = byCommon.initPrivacyControls({
        policyURL: "/privacy",
        cookiesURL: "/cookies",
        dismissalDomain: "example.test",
        onChoice: (value) => choices.push(value)
      });
      controls.update();
    });
  }

  await mount("viewer");
  const panel = page.locator("#privacy-controls");
  assert.equal(await panel.locator("strong").innerText(), "Your privacy");
  assert.equal(await panel.locator("[data-status]").isVisible(), false);
  assert.doesNotMatch(await panel.innerText(), /No choice saved|Preview only/);
  assert.ok(await panel.locator("[data-links]").evaluate((el) => el.getBoundingClientRect().top >= el.previousElementSibling.getBoundingClientRect().bottom));
  const background = () => panel.evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(await background(), "rgb(255, 255, 255)");
  await page.evaluate(() => {
    document.documentElement.dataset.bsTheme = "dark";
  });
  assert.equal(await background(), "rgb(17, 17, 17)");
  const colors = await panel.locator("[data-close], [data-choice]").evaluateAll((buttons) => buttons.map((button) => getComputedStyle(button).backgroundColor));
  assert.equal(new Set(colors).size, 3);

  await panel.locator("[data-close]").click();
  assert.deepEqual(await page.evaluate(() => choices), []);
  await mount("viewer");
  assert.equal(await panel.isVisible(), false);
  await mount("editor");
  assert.equal(await panel.isVisible(), false);
  await page.getByRole("link", { name: "Manage privacy" }).click();
  assert.ok(await panel.isVisible());
  assert.equal(await panel.count(), 1);
  await panel.locator('[data-choice="no"]').click();
  assert.deepEqual(await page.evaluate(() => choices), ["no"]);
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
    return {
      escaped,
      preferred,
      fallback,
      missing: get_csrf_token(),
      payload,
      explicit,
      readOnly,
      sameArray,
      standalone: typeof jQuery === "undefined" && typeof bySPA === "undefined"
    };
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
  let bootstrap;
  if (!reference) {
    bootstrap = process.env.SPA_TEST_BOOTSTRAP
      ? Buffer.from(process.env.SPA_TEST_BOOTSTRAP, "base64").toString("utf8")
      : execFileSync(process.env.PHP_BINARY || "php", [path.join(__dirname, "render_init.php")], {
          encoding: "utf8"
        });
  }
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

test("the loader paints the configured fade and resets immediately for the next route", { skip: Boolean(reference) }, async (t) => {
  const page = await application(t);
  await page.addStyleTag({ content: source("_transitions.css") });
  await page.evaluate(async () => {
    byCommon.GLOBAL_TRANSITION_DURATION = 600;
    await bySPA.load("/next");
  });
  const sample = await page.waitForFunction(() => {
    const loader = document.getElementById("spa-loader");
    const opacity = parseFloat(loader.style.opacity);
    if (opacity > 0.05 && opacity < 0.5) return [opacity, Number(getComputedStyle(loader).opacity)];
  });
  const [opacity, rendered] = await sample.jsonValue();
  assert.ok(Math.abs(rendered - opacity) < 0.01, `Painted opacity ${rendered} should match ${opacity}`);
  const { restored, display } = await page.evaluate(async () => {
    const loader = document.getElementById("spa-loader");
    const next = bySPA.load("/slow");
    const restored = Number(getComputedStyle(loader).opacity);
    document.documentElement.classList.add("no-motion");
    await next;
    return { restored, display: getComputedStyle(loader).display };
  });
  assert.equal(restored, 1);
  assert.equal(display, "none");
});

test("route metadata overrides shell defaults and releases them on the next navigation", { skip: Boolean(reference) }, async (t) => {
  const page = await application(t);
  const snapshot = await page.evaluate(async () => {
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = "https://example.test/";
    document.head.append(canonical);
    document.title = "Shell";
    const title = 'Kit <&> "preview"';
    bySPA.ROUTES["/kit"] = {
      URI: "/known",
      METADATA: { title, description: "Route description", canonical: "https://example.test/kit", "og:title": "Shared kit" }
    };
    await bySPA.load("/kit");
    const kit = {
      title: document.title,
      canonical: canonical.href,
      count: document.querySelectorAll('link[rel="canonical"]').length,
      og: document.querySelector('meta[property="og:title"]').content,
      twitter: document.querySelector('meta[name="twitter:title"]').content
    };
    await bySPA.load("/known");
    const slow = $.Deferred();
    const ajax = $.ajax;
    $.ajax = (request) => (request.url.includes("/late-fragment") ? slow.promise() : ajax(request));
    bySPA.ROUTES["/late"] = { URI: "/late-fragment", METADATA: { title: "Late" } };
    const superseded = bySPA.load("/late");
    await bySPA.load("/known");
    slow.resolve("<p>Late fragment</p>");
    await superseded;
    $.ajax = () => $.Deferred().reject({ status: 500 }, "error", "test").promise();
    await bySPA.load("/kit");
    return { kit, title: document.title, canonical: canonical.href, extra: !!document.querySelector('meta[property="og:title"]') };
  });
  assert.deepEqual(snapshot, {
    kit: { title: 'Kit <&> "preview"', canonical: "https://example.test/kit", count: 1, og: "Shared kit", twitter: 'Kit <&> "preview"' },
    title: "Shell",
    canonical: "https://example.test/",
    extra: false
  });
});

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
          return {
            events: window.events.map((event) => event.type),
            errors: requests.filter((request) => /_error\.(php|html)/.test(request.url)).length
          };
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

test("a component refresh or clear supersedes older requests on the same route", { timeout: 30000, skip: Boolean(reference) }, async (t) => {
  const page = await application(t);
  const result = await page.evaluate(async () => {
    const slot = document.body.appendChild(document.createElement("aside"));
    slot.id = "refresh-slot";
    const pending = [];
    $.ajax = () => {
      const request = $.Deferred();
      pending.push(request);
      return request.promise();
    };
    const old = bySPA.reloadComponent("#refresh-slot", "old");
    const fresh = bySPA.reloadComponent("#refresh-slot", "fresh");
    pending[1].resolve("new");
    await fresh;
    pending[0].reject({ status: 503 });
    await old;
    const afterFailure = slot.textContent;
    const late = bySPA.reloadComponent("#refresh-slot", "late");
    bySPA.reloadComponent("#refresh-slot", "");
    pending[2].resolve("old");
    await late;
    return [afterFailure, slot.textContent];
  });
  assert.deepEqual(result, ["new", ""]);
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
        return {
          events: events.map((event) => event.type),
          requests: requests.map((request) => request.url),
          pendingHTML,
          probes,
          html: document.getElementById("spa-content")?.innerHTML,
          url: bySPA.URL
        };
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
    window.savedRuntime = {
      load: bySPA.load,
      common: byCommon.init,
      memory: byStorage.memory,
      navigation: bySPA.NAVIGATION_ID,
      history: bySPA.HISTORY_INDEX,
      requests: requests.length,
      events: events.length
    };
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

test("navigation waits for external and inline fragment scripts before announcing load", { timeout: 30000 }, async (t) => {
  const page = await application(t);
  await page.route("**/release-dependency.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "window.releaseOrder.push('external'); window.releaseDependency = 42;"
    })
  );
  const result = await page.evaluate(async () => {
    window.releaseOrder = [];
    document.addEventListener("bySPA:load", () => releaseOrder.push("loaded"), { once: true });
    $.ajax = () =>
      $.Deferred()
        .resolve(/* HTML */ `
          <p id="release-fragment">Loaded</p>
          <script src="/release-dependency.js"></script>
          <script>
            window.releaseOrder.push(window.releaseDependency === 42 ? "inline" : "missing dependency");
          </script>
        `)
        .promise();
    await bySPA.load("/next");
    return { order: releaseOrder, content: document.getElementById("release-fragment")?.textContent };
  });
  assert.deepEqual(result, { order: ["external", "inline", "loaded"], content: "Loaded" });
});
