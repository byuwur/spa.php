const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");

const root = path.join(__dirname, "..");
let browser;
test.before(async () => {
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || undefined });
});
test.after(async () => {
  await browser?.close();
});

/**
 * Open a page with local SPA transition assets and close it after the test.
 * @param {import("node:test").TestContext} t Test owning the page.
 * @param {boolean} [common=false] Load common CSS to check its transition import.
 * @returns {Promise<import("playwright").Page>} Browser page for this test.
 */
async function pageFor(t, common = false) {
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.route("https://motion.test/**", async (route) => {
    const file = new URL(route.request().url()).pathname.slice(1);
    if (["_transitions.css", "_transitions.js", "_common.css", "_fonts.css"].includes(file)) {
      return route.fulfill({ path: path.join(root, file), contentType: file.endsWith("css") ? "text/css" : "text/javascript" });
    }
    if (file.startsWith("css/webfonts/")) return route.fulfill({ path: path.join(root, file), contentType: "application/octet-stream" });
    return route.fulfill({
      contentType: "text/html; charset=UTF-8",
      body: '<!doctype html><html><head><meta charset="UTF-8"><style>#panel { width: 16rem; line-height: 20px; overflow: auto; } #panel p { margin: 0; } #plain { height: 20px; }</style></head><body><div id="panel"><p>First line</p><button id="keep">Keep this node</button></div><div id="plain">Plain</div><div class="byCODEdocument"><span id="embedded">Code</span></div></body></html>'
    });
  });
  await page.goto("https://motion.test/");
  await page.addStyleTag({ url: `https://motion.test/${common ? "_common.css" : "_transitions.css"}` });
  await page.addScriptTag({ url: "https://motion.test/_transitions.js" });
  return page;
}

test("common imports generic transitions and resource styles can override them", async (t) => {
  const page = await pageFor(t, true);
  assert.equal(await page.locator("#plain").evaluate((node) => getComputedStyle(node).transitionDuration.split(",")[0]), "0.3s");
  assert.equal(await page.locator("#embedded").evaluate((node) => getComputedStyle(node).transitionDuration.split(",")[0]), "0.3s");
  await page.addStyleTag({ content: ".byCODEdocument * { transition: none !important; }" });
  assert.equal(await page.locator("#embedded").evaluate((node) => getComputedStyle(node).transitionDuration), "0s");
  await page.evaluate(() => document.documentElement.style.setProperty("--transition-duration", "80ms"));
  assert.equal(await page.locator("#plain").evaluate((node) => getComputedStyle(node).transitionDuration.split(",")[0]), "0.08s");
});

test("explicit content changes preserve nodes, use host timing, and restore overflow", async (t) => {
  const page = await pageFor(t);
  const result = await page.evaluate(async () => {
    document.documentElement.style.setProperty("--transition-duration", "80ms");
    const button = document.getElementById("keep");
    button.addEventListener("click", () => {
      window.clicks = (window.clicks || 0) + 1;
    });
    const animations = byTransition("#panel", (element) => element.append(Object.assign(document.createElement("p"), { textContent: "More content\nMore content" })));
    const animation = animations[0];
    const frames = animation.effect.getKeyframes();
    const { duration, easing } = animation.effect.getTiming();
    const clipped = getComputedStyle(document.getElementById("panel")).overflow === "hidden";
    await animation.finished;
    button.click();
    return {
      count: animations.length,
      duration,
      easing,
      clipped,
      grows: parseFloat(frames[1].height) > parseFloat(frames[0].height),
      sameNode: button === document.getElementById("keep"),
      clicks,
      overflow: document.getElementById("panel").style.overflow
    };
  });
  assert.deepEqual(result, { count: 1, duration: 80, easing: "ease", clipped: true, grows: true, sameNode: true, clicks: 1, overflow: "" });
});

test("children controls direct-child effects and descendant observation", async (t) => {
  const page = await pageFor(t);
  const counts = await page.evaluate(async () => {
    const panel = document.getElementById("panel");
    panel.innerHTML = '<div id="nested"><span id="deep">First</span></div>';
    let calls = 0;
    const parentOnly = byTransition(
      panel,
      () => {
        calls++;
      },
      { duration: 20 }
    );
    await parentOnly[0].finished;
    const withChildren = byTransition(
      panel,
      () => {
        calls++;
      },
      { duration: 20, children: true }
    );
    for (const animation of withChildren) await animation.finished;
    return { parentOnly: parentOnly.length, withChildren: withChildren.length, calls };
  });
  assert.deepEqual(counts, { parentOnly: 1, withChildren: 2, calls: 2 });
  await page.evaluate(() => {
    window.effects = [];
    const panel = document.getElementById("panel");
    const animate = panel.animate.bind(panel);
    panel.animate = (...args) => {
      const animation = animate(...args);
      effects.push(animation);
      return animation;
    };
    window.watcher = byTransition.watch(panel, { duration: 30, children: false });
    document.getElementById("deep").textContent = "Child change";
  });
  await page.waitForTimeout(60);
  assert.equal(await page.evaluate(() => effects.length), 0);
  await page.evaluate(() => {
    watcher.disconnect();
    window.watcher = byTransition.watch("#panel", { duration: 30, children: true });
    document.getElementById("deep").textContent = "Observed child change";
  });
  await page.waitForFunction(() => effects.length === 1);
  await page.evaluate(() => effects[0].finished);
  await page.evaluate(() => watcher.disconnect());
  await assert.rejects(
    page.evaluate(() => byTransition("#panel", () => {}, { children: "yes" })),
    /children/
  );
});

test("watchers coalesce changes, share explicit updates, and disconnect without touching replacements", async (t) => {
  const page = await pageFor(t);
  await page.evaluate(() => {
    window.effects = [];
    const panel = document.getElementById("panel");
    const animate = panel.animate.bind(panel);
    panel.animate = (...args) => {
      const effect = animate(...args);
      effects.push(effect);
      return effect;
    };
    window.watcher = byTransition.watch("#panel", { duration: 60 });
    panel.append(document.createElement("p"), document.createTextNode("New content"));
  });
  await page.waitForFunction(() => effects.length === 1);
  await page.evaluate(() => effects[0].finished);
  assert.equal(
    await page.evaluate(
      () =>
        byTransition(
          "#panel",
          (element) => {
            element.textContent = "Explicit change";
          },
          { duration: 90 }
        ).length
    ),
    0
  );
  await page.waitForFunction(() => effects.length === 2);
  assert.equal(await page.evaluate(() => effects[1].effect.getTiming().duration), 90);
  await page.evaluate(() => effects[1].finished);
  await page.evaluate(() => {
    watcher.disconnect();
    window.replacement = byTransition.watch("#panel", { duration: 40 });
    watcher.disconnect();
    document.getElementById("panel").textContent = "Replacement watcher";
  });
  await page.waitForFunction(() => effects.length === 3);
  await page.evaluate(() => effects[2].finished);
  await page.evaluate(() => {
    replacement.disconnect();
    document.getElementById("panel").textContent = "Disconnected";
  });
  await page.waitForTimeout(80);
  assert.equal(await page.evaluate(() => effects.length), 3);
});

test("retriggering and cancelling animations restore author styles", async (t) => {
  const page = await pageFor(t);
  await page.evaluate(() => {
    const panel = document.getElementById("panel");
    panel.style.setProperty("overflow", "auto", "important");
    window.first = byTransition(
      panel,
      (element) => {
        element.textContent = "First change";
      },
      { duration: 500 }
    )[0];
    window.second = byTransition(
      panel,
      (element) => {
        element.textContent = "Second change";
      },
      { duration: 50 }
    )[0];
  });
  assert.equal(await page.evaluate(() => first.playState), "idle");
  await page.evaluate(() => second.finished);
  assert.deepEqual(await page.locator("#panel").evaluate((node) => [node.style.overflow, node.style.getPropertyPriority("overflow")]), ["auto", "important"]);
  await page.evaluate(() => {
    byTransition(
      "#panel",
      (element) => {
        element.textContent = "Cancelled";
      },
      { duration: 500 }
    )[0].cancel();
  });
  await page.waitForFunction(() => document.getElementById("panel").style.overflow === "auto");
});

test("reduced motion, disabled motion, excluded content and invalid options retain update semantics", async (t) => {
  const page = await pageFor(t);
  assert.equal(
    await page.evaluate(
      () =>
        byTransition(
          "#embedded",
          (element) => {
            element.textContent = "Updated code";
          },
          { exclude: ".byCODEdocument" }
        ).length
    ),
    0
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await page.locator("#plain").evaluate((element) => getComputedStyle(element).transitionDuration.split(",")[0]), "0.3s");
  await page.addStyleTag({ content: "@media (prefers-reduced-motion: reduce) { :root { --transition-duration: 0s; } }" });
  assert.equal(
    await page.evaluate(
      () =>
        byTransition("#plain", (element) => {
          element.textContent = "Reduced motion";
        }).length
    ),
    0
  );
  assert.equal(await page.locator("#plain").textContent(), "Reduced motion");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => document.documentElement.classList.add("no-motion"));
  assert.equal(
    await page.evaluate(
      () =>
        byTransition("#plain", (element) => {
          element.textContent = "Disabled motion";
        }).length
    ),
    0
  );
  await page.evaluate(() => document.documentElement.classList.remove("no-motion"));
  await assert.rejects(
    page.evaluate(() =>
      byTransition(
        "#plain",
        (element) => {
          element.textContent = "Should not run";
        },
        { duration: -1 }
      )
    ),
    /duration/
  );
  assert.equal(await page.locator("#plain").textContent(), "Disabled motion");
  await page.evaluate(() => (document.documentElement.dataset.overlay = ""));
  assert.equal(
    await page.evaluate(
      () =>
        byTransition(
          "#plain",
          (element) => {
            element.textContent = "Overlay";
          },
          { exclude: "[data-overlay]" }
        ).length
    ),
    0
  );
  assert.equal(await page.locator("#plain").textContent(), "Overlay");
  const source = await fs.readFile(path.join(root, "_transitions.js"), "utf8");
  await page.addScriptTag({ content: source });
  assert.equal(await page.evaluate(() => typeof byTransition.watch), "function");
});
