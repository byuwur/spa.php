const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const { deflateRawSync, inflateRawSync } = require("node:zlib");
const { source } = require("./parity-source");

// Isolate standalone helpers; overrides supply only the dependencies a contract needs.
function loadHelpers(overrides = {}) {
  const context = { Blob, Response, Uint8Array, TextDecoder, CompressionStream, DecompressionStream, atob, btoa, ...overrides };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "_functions.js"), "utf8"), context);
  return context;
}

test("standalone helpers preserve existing public globals", () => {
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "_functions.js"), "utf8"), context);
  const entries = [
    "check_json",
    "parse_json",
    "print_json",
    "is_object",
    "escape_html",
    "std_dir_separator",
    "dirname",
    "exit_json",
    "compress_url_data",
    "decompress_url_data",
    "set_cookie",
    "get_cookie",
    "get_url_param",
    "debounce",
    "destroy_modal_front",
    "show_modal_front",
    "get_csrf_token",
    "add_csrf_token",
    "remote_file_exists",
    "make_http_request",
    "element_make_http_request",
    "init_websocket"
  ];
  assert.deepEqual(Object.keys(context).sort(), entries.sort());
  for (const name of entries) assert.equal(typeof context[name], "function", name);
  assert.equal(context.parse_json('{"ok":true}').ok, true);
});

test("JSON helpers preserve parsed values and native stringify failures", () => {
  const { check_json, parse_json, print_json } = loadHelpers();
  for (const [text, expected] of [
    ["null", null],
    ["false", false],
    ["0", 0],
    ['"hello"', "hello"]
  ]) {
    assert.equal(check_json(text), true);
    assert.equal(parse_json(text), expected);
    assert.equal(print_json(text), JSON.stringify(expected, null, 2));
  }
  for (const value of ["", "{", "plain text", undefined, null, false, 0, { ok: true }]) {
    assert.equal(parse_json(value), null);
    assert.equal(print_json(value), JSON.stringify(value, null, 2));
  }
  const circular = {};
  circular.self = circular;
  for (const value of [circular, 1n]) assert.throws(() => print_json(value), { name: "TypeError" });
});

test("WebSocket controllers avoid duplicate connections and cancel queued reconnects", () => {
  const timers = new Map();
  const sockets = [];
  let nextTimer = 0;
  class WebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    constructor() {
      this.readyState = WebSocket.CONNECTING;
      sockets.push(this);
    }
    close() {
      if (this.readyState === 3) return;
      this.readyState = 3;
      this.onclose?.({ code: 1000 });
    }
    send(value) {
      this.sent = value;
    }
  }
  const { init_websocket } = loadHelpers({
    WebSocket,
    window: { location: { protocol: "http:" } },
    byStorage: { getItem: () => "PROD" },
    $: () => ({ length: 1 }),
    setTimeout(callback) {
      timers.set(++nextTimer, callback);
      return nextTimer;
    },
    clearTimeout(timer) {
      timers.delete(timer);
    }
  });
  const controller = init_websocket({ host: "localhost", port: 1234, path: "socket", elementId: "#socket" });
  controller.connect();
  assert.equal(sockets.length, 1, "a connecting transport is reused");
  sockets[0].readyState = WebSocket.OPEN;
  controller.send('{"ok":true}');
  assert.equal(sockets[0].sent, JSON.stringify({ ok: true }, null, 2));
  sockets[0].close();
  assert.equal(timers.size, 1, "an unexpected close schedules reconnection");
  controller.close();
  assert.equal(timers.size, 0, "manual close cancels the pending reconnection");
  controller.retry();
  assert.equal(timers.size, 1, "explicit retry can restart a closed controller");
  controller.connect();
  assert.equal(sockets.length, 2);
  assert.equal(timers.size, 0, "immediate connection replaces its delayed retry");
  controller.close();
});

test("local URL helpers preserve UTF-8 text and interoperate with raw DEFLATE", async () => {
  const { compress_url_data, decompress_url_data } = loadHelpers();
  for (const text of ["", "\uFEFFleading BOM", "Café 日本語 😀\u0000 + / = & ?", JSON.stringify([{ platform: "twitch", handle: "/byUwUr" }])]) {
    const token = await compress_url_data(text);
    assert.match(token, /^[A-Za-z0-9_-]+$/);
    assert.equal(await decompress_url_data(new URLSearchParams({ data: token }).get("data")), text);
    assert.equal(inflateRawSync(Buffer.from(token, "base64url")).toString("utf8"), text);
    const external = deflateRawSync(Buffer.from(text)).toString("base64url");
    assert.equal(await decompress_url_data(external), text);
  }
});

test("local URL decompression enforces byte limits before collecting oversized output", async () => {
  const { compress_url_data, decompress_url_data } = loadHelpers();
  const text = "😀".repeat(32);
  const token = await compress_url_data(text);
  const size = Buffer.byteLength(text);
  assert.equal(await decompress_url_data(token, size), text);
  await assert.rejects(decompress_url_data(token, size - 1), { name: "RangeError" });
  const oversized = deflateRawSync(Buffer.alloc(1048577, 65)).toString("base64url");
  await assert.rejects(decompress_url_data(oversized), { name: "RangeError" });
  for (const limit of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "128"]) {
    await assert.rejects(decompress_url_data(token, limit), { name: "RangeError" });
  }
});

test("local URL helpers reject invalid tokens, truncated streams, and invalid UTF-8", async () => {
  const { compress_url_data, decompress_url_data } = loadHelpers();
  for (const value of [null, {}, 1]) await assert.rejects(compress_url_data(value), { name: "TypeError" });
  for (const token of [null, {}, "", "a", "a+b", "a/b", "a=", "a b", "%%%"]) {
    await assert.rejects(decompress_url_data(token), { name: "TypeError" });
  }
  const compressed = deflateRawSync(Buffer.from("A complete compressed stream."));
  await assert.rejects(decompress_url_data(compressed.subarray(0, -1).toString("base64url")));
  await assert.rejects(decompress_url_data("AA"));
  const invalidUTF8 = deflateRawSync(Buffer.from([255])).toString("base64url");
  await assert.rejects(decompress_url_data(invalidUTF8), { name: "TypeError" });
});

test("local URL helpers reject unavailable native APIs without changing formats", async () => {
  const { compress_url_data } = loadHelpers({ CompressionStream: undefined });
  await assert.rejects(compress_url_data("text"), { name: "TypeError" });
  const token = deflateRawSync(Buffer.from("text")).toString("base64url");
  const { decompress_url_data } = loadHelpers({ DecompressionStream: undefined });
  await assert.rejects(decompress_url_data(token), { name: "TypeError" });
});

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
