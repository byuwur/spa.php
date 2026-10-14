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
