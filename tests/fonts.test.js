const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "..", "_fonts.js"), "utf8");

function jqueryFixture() {
  const jquery = function () {};
  jquery.fn = {};
  return jquery;
}

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
    window: { byFont: namespace, jQuery: jqueryFixture() },
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

test("font namespace preserves host properties and works without picker libraries or eager downloads", () => {
  const namespace = { hostFont: "Arial" };
  const { fonts, links } = loadFonts(namespace);
  assert.equal(fonts, namespace);
  assert.equal(fonts.hostFont, "Arial");
  assert.ok(fonts.families.length >= 300);
  assert.ok(fonts.families.includes("Inter"));
  assert.equal(links.length, 0);
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
