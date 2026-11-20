const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const vm = require("node:vm");
const path = require("node:path");

test("direct requests contain one route-specific preview before any JavaScript runs", () => {
  const php = `$_SERVER["SCRIPT_FILENAME"] = realpath("home.php");
    $_SERVER["PHP_SELF"] = "/demo/home.php";
    $_SERVER["HTTP_HOST"] = "localhost";
    $_GET["uri"] = "/kit";
    require "home.php";`;
  const html = execFileSync(process.env.PHP_BINARY || "php", ["-r", php], { cwd: path.join(__dirname, "../demo"), encoding: "utf8" });
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)[1];
  assert.equal(head.match(/<title\b/g).length, 1);
  assert.match(head, /<title[^>]*>UI Kit \| SPA\.php<\/title>/);
  for (const key of ["og:title", "twitter:title", "description", "og:url", "canonical"]) {
    assert.equal(head.split(`="${key}"`).length - 1, 1, key);
  }
  assert.match(head, /property="og:url" content="https:\/\/spa\.byuwur\.co\/demo\/kit"/);
});

test("PHP initial router preserves literal and encoded query suffixes", () => {
  for (const query of ["q=a?b", "q=a%3Fb"]) {
    const html = execFileSync(process.env.PHP_BINARY || "php", [path.join(__dirname, "render_init.php"), "root", "https://example.test/app", query], { encoding: "utf8" });
    const disk = new Map();
    const context = {
      localStorage: { getItem: (key) => disk.get(key) ?? null, setItem: (key, value) => disk.set(key, String(value)), removeItem: (key) => disk.delete(key) },
      document: { baseURI: "https://example.test/app/" },
      URL,
      console
    };
    context.window = context;
    vm.createContext(context);
    for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(script[1], context);
    assert.equal(JSON.parse(context.byStorage.getItem("_GET")).q, "a?b");
    assert.equal(new URL(context.byStorage.getItem("URL"), "https://example.test").searchParams.get("q"), "a?b");
  }
});
