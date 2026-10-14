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
  await page.addScriptTag({ path: path.join(root, "_fonts.js") });
  assert.equal(await page.evaluate(() => typeof window.jQuery), "undefined");
  await page.evaluate(() => {
    byFont.init();
    byFont.destroy();
  });
  for (const file of ["js/jquery.min.js", "js/select2.full.min.js", "js/popper.min.js", "js/bootstrap.min.js", "_common.js"]) await page.addScriptTag({ path: path.join(root, file) });
  return { page, requests, errors };
}

test("common initialization preserves saved fonts, reuses widgets, and resets previews", async (t) => {
  const { page, requests, errors } = await fontPage(
    t,
    /* HTML */ ` <main id="spa-content"
      ><form id="settings">
        <label>Font <input id="font" name="fontFamily" class="form-control" data-font-picker value="My Installed Font" maxlength="80" /></label>
        <input id="weight" type="number" value="700" />
        <button type="reset">Reset</button>
      </form></main
    >`
  );
  await page.evaluate(() => {
    byFont.picker(document.getElementById("font"), { weight: document.getElementById("weight") });
    window.initialWidget = $("#font").data("select2");
    byCommon.init({ showWarn: false });
    byCommon.init({ showWarn: false });
  });
  await page.waitForFunction(() => document.querySelectorAll(".font-preview").length === 1);
  assert.equal(await page.locator("#font").inputValue(), "My Installed Font");
  assert.equal(await page.locator("#font").getAttribute("name"), "fontFamily");
  assert.equal(await page.locator(".select2-container").count(), 1);
  assert.equal(await page.evaluate(() => $("#font").data("select2") === initialWidget), true);
  assert.ok((await page.locator("#font optgroup[label='Google Fonts'] option").count()) >= 300);
  assert.equal(requests.length, 0);

  await page.locator("#font + .select2-container").click();
  await page.locator(".select2-search__field").fill("Inter");
  await page.locator(".select2-search__field").press("Enter");
  assert.equal(await page.locator("#font").inputValue(), "Inter");
  assert.match(await page.locator(".font-preview").evaluate((node) => node.style.fontFamily), /Inter/);
  assert.equal(requests.filter((url) => url.includes("family=Inter:")).length, 1);
  await page.locator("#weight").fill("500");
  assert.equal(await page.locator(".font-preview").evaluate((node) => node.style.fontWeight), "500");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".font-preview").style.fontWeight === "700");
  assert.equal(await page.locator("#font").inputValue(), "My Installed Font");
  assert.match(await page.locator(".font-preview").evaluate((node) => node.style.fontFamily), /My Installed Font/);

  await page.evaluate(() => byFont.destroy(document.getElementById("font")));
  assert.equal(await page.locator(".select2-container, .font-preview").count(), 0);
  await page.evaluate(() => byFont.init());
  assert.equal(await page.locator(".font-preview").count(), 1);
  assert.equal(await page.locator("#font optgroup[label='Google Fonts'] option").count(), 350);
  assert.deepEqual(errors, []);
});

test("modal initialization retains font templates and removes old-route controls", async (t) => {
  const { page, errors } = await fontPage(
    t,
    /* HTML */ ` <main id="spa-content"
      ><div id="font-modal" class="modal" tabindex="-1">
        <div class="modal-dialog"
          ><div class="modal-content"
            ><form>
              <label
                >Font
                <select id="font" name="font" data-font-picker
                  ><option selected value="Arial">Arial</option></select
                ></label
              >
              <label>Other font <input id="font-input" data-font-picker value="Georgia" /></label>
              <select id="ordinary"
                ><option>Ordinary</option></select
              >
              <select id="custom"
                ><option>Custom</option></select
              >
            </form></div
          ></div
        >
      </div></main
    >`
  );
  await page.evaluate(() => {
    window.bySPA = { URL: "/first" };
    $("#custom").select2({ dropdownParent: $("#font-modal"), templateSelection: (option) => `Existing: ${option.text}` });
    window.customWidget = $("#custom").data("select2");
    byCommon.init({ showWarn: false });
  });
  await page.waitForFunction(() => $("#font").data("select2"));
  await page.evaluate(() => {
    window.initialWidget = $("#font").data("select2");
    byCommon.init({ showWarn: false });
    bootstrap.Modal.getOrCreateInstance(document.getElementById("font-modal")).show();
  });
  await page.locator("#font-modal").waitFor({ state: "visible" });
  assert.equal(await page.evaluate(() => $("#font").data("select2") === initialWidget), true);
  assert.equal(await page.evaluate(() => $("#custom").data("select2") === customWidget && !!$("#ordinary").data("select2")), true);
  assert.equal(await page.locator("#custom + .select2-container").innerText(), "Existing: Custom");
  assert.equal(await page.locator("#font-input").evaluate((node) => node.tagName), "SELECT");
  assert.equal(await page.locator(".font-preview").count(), 2);
  await page.locator("#font + .select2-container").click();
  assert.equal(await page.locator("#font-modal .select2-dropdown").count(), 1);
  await page.locator(".select2-search__field").fill("Inter");
  assert.ok((await page.locator(".select2-results .font-option").count()) > 0);
  await page.evaluate(() => {
    bySPA.URL = "/second";
    byCommon.init({ showWarn: false });
  });
  await page.waitForFunction(() => !document.getElementById("font-modal"));
  assert.equal(await page.locator(".font-preview, .select2-dropdown, .modal-backdrop").count(), 0);
  assert.deepEqual(errors, []);
});

test("dynamic font fields load visible samples only and dispose on SPA navigation", async (t) => {
  const { page, requests, errors } = await fontPage(
    t,
    /* HTML */ ` <main id="spa-content"
      ><form
        ><label>Font <input id="font" data-font-picker value="Arial" /></label></form
    ></main>`
  );
  await page.evaluate(() => byCommon.init({ showWarn: false }));
  await page.waitForFunction(() => $("#font").data("select2"));
  assert.equal(requests.length, 0);
  await page.locator("#font + .select2-container").click();
  await page.locator(".select2-search__field").fill("Roboto");
  await page.waitForFunction(() => document.querySelector('link[data-font-family="Roboto"]'));
  assert.ok(requests.length < 15);
  assert.match(await page.locator(".font-option[data-font='Roboto']").evaluate((node) => node.style.fontFamily), /Roboto/);
  await page.locator(".select2-search__field").fill("<img src=x onerror=alert(1)>");
  assert.equal(await page.locator(".select2-results img").count(), 0);
  await page.evaluate(() => document.dispatchEvent(new CustomEvent("bySPA:before-unload")));
  assert.equal(await page.locator(".select2-dropdown, .font-preview").count(), 0);
  await page.evaluate(() => byCommon.init({ showWarn: false }));
  await page.waitForFunction(() => $("#font").data("select2"));
  assert.equal(await page.locator(".font-preview").count(), 1);
  assert.deepEqual(errors, []);
});

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

test("Bootstrap modal controls remain usable without optional font methods", async (t) => {
  for (const [name, namespace] of [
    ["module absent", null],
    ["methods absent", {}],
    ["methods not callable", { init: true, destroy: true }]
  ]) {
    await t.test(name, async (t) => {
      const { page, errors } = await fontPage(
        t,
        /* HTML */ ` <main id="spa-content"
            ><div id="font-modal" class="modal"
              ><div class="modal-dialog"
                ><div class="modal-content">
                  <label
                    >Font
                    <select id="font" data-font-picker
                      ><option>Arial</option></select
                    ></label
                  >
                </div></div
              ></div
            ></main
          >
          <div id="stale-modal" class="modal" data-byspa-modal="true" data-byspa-route="previous"></div>`
      );
      await page.evaluate((namespace) => {
        if (namespace) window.byFont = namespace;
        else delete window.byFont;
        byCommon.init({ showWarn: false });
      }, namespace);
      await page.waitForFunction(() => $("#font").data("select2"));
      assert.equal(await page.locator("#stale-modal").count(), 0);
      assert.equal(await page.locator(".font-preview").count(), 0);
      assert.equal(await page.locator("#font option").count(), 1);
      await page.addScriptTag({ path: path.join(root, "_functions.js") });
      await page.evaluate(() => destroy_modal_front("font-modal", false));
      await page.waitForFunction(() => !document.getElementById("font-modal"));
      assert.deepEqual(errors, []);
    });
  }
});

test("scoped tooltips preserve application handlers and translated native titles", async (t) => {
  const { page, errors } = await fontPage(
    t,
    /* HTML */ ` <section id="scope"><button id="tip" data-bs-toggle="tooltip" title="Original">Tip</button></section>
      <button id="outside" data-bs-toggle="tooltip" title="Outside">Outside</button>`
  );
  const result = await page.evaluate(() => {
    byCommon.initBootstrap({ tooltipsOnly: true });
    const tip = document.getElementById("tip"),
      outside = document.getElementById("outside");
    const original = bootstrap.Tooltip.getInstance(tip),
      untouched = bootstrap.Tooltip.getInstance(outside);
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("data-byspa-modal", "true");
    modal.setAttribute("data-byspa-route", "previous");
    document.body.append(modal);
    let applicationCalls = 0,
      dismissals = 0;
    $(tip).on("pointerdown.application pointerleave.application", () => applicationCalls++);
    original.hide = () => dismissals++;
    byCommon.initBootstrap({ tooltipsOnly: true, root: document.getElementById("scope") });
    byCommon.initBootstrap({ tooltipsOnly: true, root: tip });
    $(tip).trigger("pointerdown").trigger("pointerleave");
    tip.setAttribute("title", "Translated");
    tip.setAttribute("data-bs-title", "Translated");
    byCommon.initBootstrap({ tooltipsOnly: true, root: tip, refreshTooltips: true });
    const refreshed = bootstrap.Tooltip.getInstance(tip);
    refreshed.show();
    return {
      applicationCalls,
      dismissals,
      modalPreserved: modal.isConnected,
      outsidePreserved: bootstrap.Tooltip.getInstance(outside) === untouched,
      recreated: refreshed !== original,
      nativeTitle: tip.getAttribute("data-bs-original-title")
    };
  });
  assert.deepEqual(result, { applicationCalls: 2, dismissals: 2, modalPreserved: true, outsidePreserved: true, recreated: true, nativeTitle: "Translated" });
  assert.equal(await page.locator(".tooltip-inner").textContent(), "Translated");
  assert.deepEqual(errors, []);
});

test("video initialization enhances only the player's shortcut controls", async (t) => {
  const { page, errors } = await fontPage(
    t,
    /* HTML */ ` <button id="outside" class="vjs-play-control" data-bs-toggle="tooltip" title="Outside">Outside</button>
      <video id="player" class="video-js"></video>`
  );
  await page.addScriptTag({ path: path.join(root, "js/video.min.js") });
  await page.evaluate(() => {
    byCommon.initBootstrap({ tooltipsOnly: true, root: document.getElementById("outside") });
    window.outsideTooltip = bootstrap.Tooltip.getInstance(document.getElementById("outside"));
    byCommon.initVideo("player", { autoplay: false, preload: "none" });
  });
  assert.equal(await page.locator("#player .vjs-play-control").getAttribute("data-bs-title"), "Play/Pause (K)");
  assert.equal(await page.locator("#outside").getAttribute("data-bs-title"), null);
  assert.equal(await page.evaluate(() => bootstrap.Tooltip.getInstance(document.getElementById("outside")) === outsideTooltip), true);
  assert.equal(await page.evaluate(() => !!bootstrap.Tooltip.getInstance(document.querySelector("#player .vjs-play-control"))), true);
  await page.evaluate(() => videojs.getPlayer("player").dispose());
  assert.deepEqual(errors, []);
});

test("modal dismissal cleans fonts and preserves a replacement with the same ID", async (t) => {
  const { page, errors } = await fontPage(t, /* HTML */ ` <div id="dismiss" class="modal"><input id="retired-font" data-font-picker value="Arial" /></div>`);
  await page.addScriptTag({ path: path.join(root, "_functions.js") });
  await page.evaluate(() => {
    byFont.init();
    window.retiredFont = document.getElementById("retired-font");
    // Modal cleanup uses the optional font module without requiring common UI.
    delete window.byCommon;
    destroy_modal_front("dismiss");
    const replacement = document.createElement("div");
    replacement.id = "dismiss";
    replacement.className = "modal";
    replacement.innerHTML = /* HTML */ `<input id="replacement-font" data-font-picker value="Georgia" />`;
    document.body.append(replacement);
    byFont.init(replacement);
    window.replacementWidget = $("#replacement-font").data("select2");
  });
  await page.waitForFunction(() => document.querySelectorAll("#dismiss").length === 1);
  assert.equal(await page.locator("#replacement-font").count(), 1);
  assert.equal(await page.evaluate(() => $("#replacement-font").data("select2") === replacementWidget), true);
  assert.equal(await page.evaluate(() => retiredFont.classList.contains("select2-hidden-accessible")), false);
  assert.equal(await page.locator(".font-preview").count(), 1);
  assert.deepEqual(errors, []);
});

test("PHP-rendered modal dismissal cleans font pickers", async (t) => {
  const { execFileSync } = require("node:child_process");
  const { page, errors } = await fontPage(t, /* HTML */ `<main id="spa-content"></main>`);
  const markup = execFileSync(
    process.env.PHP_BINARY || "php",
    [
      "-d",
      "xdebug.mode=off",
      "-r",
      `
    require '_functions.php';
    show_modal_back(message: '<input id="server-font" data-font-picker value="Arial">');
  `
    ],
    { cwd: root, encoding: "utf8" }
  );
  await page.evaluate((markup) => {
    window.modalShown = new Promise((resolve) => $(document).one("shown.bs.modal", resolve));
    $("body").append(markup);
    byFont.init();
    window.serverFont = document.getElementById("server-font");
  }, markup);
  await page.evaluate(async () => {
    await modalShown;
  });
  assert.equal(await page.locator(".font-preview").count(), 1);
  await page.evaluate(() => destroy_modal_back());
  await page.waitForFunction(() => !document.getElementById("modal_back"));
  assert.equal(await page.evaluate(() => serverFont.classList.contains("select2-hidden-accessible")), false);
  assert.equal(await page.locator(".font-preview").count(), 0);
  for (const namespace of [null, {}, { destroy: true }]) {
    await page.evaluate(
      ({ markup, namespace }) => {
        if (namespace) window.byFont = namespace;
        else delete window.byFont;
        window.modalShown = new Promise((resolve) => $(document).one("shown.bs.modal", resolve));
        $("body").append(markup);
      },
      { markup, namespace }
    );
    await page.evaluate(async () => {
      await modalShown;
    });
    await page.evaluate(() => destroy_modal_back());
    await page.waitForFunction(() => !document.getElementById("modal_back"));
  }
  assert.deepEqual(errors, []);
});
