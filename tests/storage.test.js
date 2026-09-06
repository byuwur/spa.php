const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const vm = require("node:vm");
const path = require("node:path");

function initialize(storage, app = "app", copy = "root") {
  const html = execFileSync(process.env.PHP_BINARY || "php", [path.join(__dirname, "render_init.php"), copy, `https://example.test/${app}`], { encoding: "utf8" });
  const context = { localStorage: storage, document: { baseURI: `https://example.test/${app}/` }, URL, console };
  context.window = context;
  vm.createContext(context);
  for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(script[1], context);
  return context.byStorage;
}

for (const copy of ["root", "demo"]) {
  test(`${copy} emitted initializer preserves per-key authority and recovery`, () => {
    const disk = new Map([["APP_THEME", "light"]]);
    let failWrite = false, failRead = false;
    const storage = {
      getItem(key) { if (failRead) throw Error("denied"); return disk.get(key) ?? null; },
      setItem(key, value) { if (failWrite) throw Error("quota"); disk.set(key, String(value)); },
      removeItem(key) { if (failWrite) throw Error("denied"); disk.delete(key); }
    };
    const local = initialize(storage, "app", copy);
    assert.equal(local.getItem("APP_THEME"), "light");
    assert.equal(disk.has("APP_THEME"), false);
    disk.set(local.prefix + "live", "one");
    local.setItem("old", "disk");
    failWrite = true;
    local.setItem("old", "local");
    local.setItem("new", "created");
    assert.equal(local.getItem("old"), "local");
    assert.equal(local.getItem("new"), "created");
    local.removeItem("old");
    assert.equal(local.getItem("old"), null);
    failWrite = false;
    disk.set(local.prefix + "old", "other-tab");
    disk.set(local.prefix + "live", "two");
    assert.equal(local.getItem("old"), null);
    assert.equal(local.getItem("live"), "two");
    local.setItem("old", "restored");
    assert.equal(local.getItem("old"), "restored");
    disk.set(local.prefix + "old", "live-again");
    assert.equal(local.getItem("old"), "live-again");
    disk.set("old", "legacy");
    local.removeItem("old");
    assert.equal(local.getItem("old"), null);
    failWrite = true;
    disk.set("APP_LANG", "en");
    assert.equal(local.getItem("APP_LANG"), "en");
    disk.set("APP_LANG", "fr");
    assert.equal(local.getItem("APP_LANG"), "en");
    failRead = true;
    local.setItem("denied", "memory");
    assert.equal(local.getItem("denied"), "memory");
    local.removeItem("denied");
    assert.equal(local.getItem("denied"), null);
    failRead = failWrite = false;
    const other = initialize(storage, "other", copy);
    assert.equal(other.getItem("APP_THEME"), null);
    assert.equal(other.getItem("new"), null);
    failRead = failWrite = true;
    const denied = initialize(storage, "denied", copy);
    assert.equal(denied.getItem("HOME_PATH"), "https://example.test/denied");
    denied.setItem("APP_THEME", "light");
    assert.equal(denied.getItem("APP_THEME"), "light");
  });
}
