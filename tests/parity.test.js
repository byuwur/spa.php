const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const { source } = require("./parity-source");

function queryContract(code) {
  for (const [search, hash, expected] of [
    ["", "#/known?q=a?b", "a?b"],
    ["", "#/known?q=a%3Fb", "a?b"],
    ["?q=document", "#/known?q=hash", "document"]
  ]) {
    const context = { window: { location: new URL(`https://example.test/app/${search}${hash}`) }, URL, URLSearchParams };
    vm.createContext(context);
    vm.runInContext(code, context);
    assert.equal(context.get_url_param("q"), expected);
  }
}

test("intentional helper mirror satisfies the query vectors", () => {
  queryContract(source("_functions.js"));
});

test("mirror vector rejects a deliberately mismatched helper", () => {
  const original = source("_functions.js");
  const truncated = original.replace('hash.slice(hash.indexOf("?") + 1)', 'hash.split("?")[1]');
  assert.notEqual(truncated, original, "negative control must alter the actual helper");
  assert.throws(() => queryContract(truncated), assert.AssertionError);
});
