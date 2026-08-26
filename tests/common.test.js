const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadCommon() {
  const warnings = [];
  const errors = [];
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
    return chain;
  };
  const window = { byCommon: {}, jQuery: $ };
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
  return { byCommon: window.byCommon, warnings, errors };
}

test("byCommon.init can suppress warnings for one call", () => {
  const harness = loadCommon();
  harness.byCommon.init({ showWarn: false });
  assert.equal(harness.warnings.length, 0);
  assert.equal(harness.errors.length, 0);
});

test("byCommon.init remains quiet by default", () => {
  const harness = loadCommon();
  harness.byCommon.init();
  assert.equal(harness.warnings.length, 0);
});

test("INIT_WARNINGS can enable automatic initialization warnings", () => {
  const harness = loadCommon();
  harness.byCommon.INIT_WARNINGS = true;
  harness.byCommon.init();
  assert.ok(harness.warnings.length > 0);
});

test("initBootstrap supports the same one-call suppression", () => {
  const harness = loadCommon();
  harness.byCommon.initBootstrap({ showWarn: false });
  assert.equal(harness.warnings.length, 0);
});
