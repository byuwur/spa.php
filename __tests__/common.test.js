const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadCommon(window = { byCommon: {} }) {
  const warnings = [];
  const errors = [];
  const styles = {};
  const chain = {
    length: 0,
    off() {
      return this;
    },
    on() {
      return this;
    }
  };
  const $ = function (value) {
    if (typeof value === "function") value();
    return {
      ...chain,
      css(property, setting) {
        styles[value] ??= {};
        styles[value][property] = setting;
        return this;
      }
    };
  };
  window.jQuery = $;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "_common.js"), "utf8"), {
    window,
    document: {},
    $,
    jQuery: $,
    console: {
      log() {},
      warn(...args) {
        warnings.push(args);
      },
      error(...args) {
        errors.push(args);
      }
    }
  });
  return { byCommon: window.byCommon, warnings, errors, styles };
}

test("jQuery modules stop before publishing APIs or reading application state when the dependency is missing", () => {
  const modules = { "_common.js": ["byCommon"], "_spa.js": ["bySPA"] };
  for (const [file, namespaces] of Object.entries(modules)) {
    const errors = [];
    const window = {};
    const context = { window, console: { error: (message) => errors.push(message) } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context);
    assert.deepEqual(Object.keys(window), namespaces, `${file} published unexpected globals`);
    for (const namespace of namespaces) assert.deepEqual(Object.keys(window[namespace]), [], `${file} initialized without jQuery`);
    assert.deepEqual(errors, [`Init ${file} FAILED. No jQuery found.`]);
  }
});

test("byCommon preserves configuration after a missing dependency and initializes only once on retry", () => {
  const byCommon = { SECTION_TOP_OVERHEAD: 125 };
  const window = { byCommon };
  const errors = [];
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "_common.js"), "utf8"), {
    window,
    console: { error: (message) => errors.push(message) }
  });
  assert.equal(window.byCommon, byCommon);
  assert.deepEqual(Object.keys(byCommon), ["SECTION_TOP_OVERHEAD"]);
  assert.deepEqual(errors, ["Init _common.js FAILED. No jQuery found."]);

  loadCommon(window);
  assert.equal(window.byCommon, byCommon);
  assert.equal(byCommon.initialized, true);
  assert.equal(byCommon.SECTION_TOP_OVERHEAD, 125);
  const init = byCommon.init;
  loadCommon(window);
  assert.equal(byCommon.init, init);
});
