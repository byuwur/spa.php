const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const vm = require("node:vm");
const path = require("node:path");


test("PHP initial router preserves literal and encoded query suffixes", () => {
  for (const query of ["q=a?b", "q=a%3Fb"]) {
    const html = execFileSync(process.env.PHP_BINARY || "php", [path.join(__dirname, "render_init.php"), "root", "https://example.test/app", query], { encoding: "utf8" });
    const disk = new Map();
    const context = { localStorage: { getItem: key => disk.get(key) ?? null, setItem: (key, value) => disk.set(key, String(value)), removeItem: key => disk.delete(key) }, document: { baseURI: "https://example.test/app/" }, URL, console };
    context.window = context;
    vm.createContext(context);
    for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(script[1], context);
    assert.equal(JSON.parse(context.byStorage.getItem("_GET")).q, "a?b");
    assert.equal(new URL(context.byStorage.getItem("URL"), "https://example.test").searchParams.get("q"), "a?b");
  }
});
