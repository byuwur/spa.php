const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "..", "_fonts.js"), "utf8");

function loadFonts(namespace = {}) {
  const links = [],
    timers = new Map(),
    fontCalls = [];
  const document = {
    createElement: () => ({ dataset: {} }),
    head: { append: (link) => links.push(link) },
    fonts: {
      load: async (...args) => {
        fontCalls.push(args);
        return [{}];
      }
    }
  };
  const context = vm.createContext({
    window: { byFont: namespace },
    document,
    Promise,
    CSS: { supports: (_, value) => !value.includes(";") },
    setTimeout(callback, delay) {
      const timer = {};
      timers.set(timer, { callback, delay });
      return timer;
    },
    clearTimeout: (timer) => timers.delete(timer)
  });
  const reload = () => vm.runInContext(source, context);
  reload();
  return {
    fonts: context.window.byFont,
    document,
    links,
    fontCalls,
    reload,
    expire(delay) {
      for (const [timer, task] of timers)
        if (task.delay === delay) {
          timers.delete(timer);
          task.callback();
        }
    }
  };
}

test("font namespace preserves host properties and works without jQuery or eager downloads", () => {
  const namespace = { hostFont: "Arial" };
  const { fonts, links } = loadFonts(namespace);
  assert.equal(fonts, namespace);
  assert.equal(fonts.hostFont, "Arial");
  assert.ok(fonts.families.length >= 300);
  assert.ok(fonts.families.includes("Inter"));
  assert.equal(links.length, 0);
  const field = {};
  assert.equal(fonts.picker(field), field);
  fonts.init();
  fonts.destroy();
  assert.equal(links.length, 0);
});

test("installed families and invalid stacks keep fallbacks without remote requests", () => {
  const { fonts, links } = loadFonts();
  assert.equal(fonts.family("Courier New", "monospace"), "Courier New, monospace");
  assert.equal(fonts.stack("broken;"), "system-ui, sans-serif");
  assert.equal(fonts.family("My Installed Font"), "My Installed Font, system-ui, sans-serif");
  assert.equal(links.length, 0);
});

test("case-insensitive families and repeated script imports share one request cache", () => {
  const { fonts, links, reload } = loadFonts();
  fonts.family("Inter");
  fonts.family("'inter', Arial");
  reload();
  fonts.family("INTER");
  assert.equal(links.length, 1);
  assert.match(links[0].href, /^https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@/);
  assert.ok(links[0].href.endsWith("&display=swap"));
});

test("font readiness waits for its stylesheet and the requested rendering weight", async () => {
  const { fonts, links, fontCalls } = loadFonts();
  const ready = fonts.ready("Inter", 700, "Overlay text");
  assert.equal(fontCalls.length, 0);
  links[0].onload();
  assert.equal(await ready, true);
  assert.deepEqual(fontCalls, [['700 16px "Inter"', "Overlay text"]]);
});

test("offline failures retain fallbacks and do not retry while browsing", async () => {
  const { fonts, links } = loadFonts();
  const ready = fonts.ready("Inter");
  links[0].onerror();
  assert.equal(await ready, false);
  fonts.family("Inter");
  assert.equal(await fonts.ready("Inter"), false);
  assert.equal(links.length, 1);
});

test("stylesheet and measurement timeouts settle without blocking overlays", async () => {
  const harness = loadFonts();
  const ready = harness.fonts.ready("Inter");
  harness.expire(3000);
  assert.equal(await ready, false);
  harness.expire(8000);
  assert.equal(await harness.fonts.ready("Inter"), false);
  assert.equal(harness.links.length, 1);
});

test("failed font-face loads are handled without throwing", async () => {
  const { fonts, links, document } = loadFonts();
  document.fonts.load = () => Promise.reject(new Error("Unavailable font"));
  const ready = fonts.ready("Inter");
  links[0].onload();
  assert.equal(await ready, false);
});

test("glyph readiness shares the deadline and ignores completion after timeout", async () => {
  const harness = loadFonts();
  let finishGlyphs;
  harness.document.fonts.load = () =>
    new Promise((resolve) => {
      finishGlyphs = resolve;
    });
  const ready = harness.fonts.ready("Inter");
  harness.links[0].onload();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(typeof finishGlyphs, "function");
  harness.expire(3000);
  assert.equal(await ready, false);
  finishGlyphs([{}]);
  assert.equal(await ready, false);
});
