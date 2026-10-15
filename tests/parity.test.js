const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const { deflateRawSync, inflateRawSync } = require("node:zlib");
const { source } = require("./parity-source");

function loadURLHelpers(overrides = {}) {
  const context = { Blob, Response, Uint8Array, TextDecoder, CompressionStream, DecompressionStream, atob, btoa, ...overrides };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "_functions.js"), "utf8"), context);
  return context;
}

test("local URL helpers preserve UTF-8 text and interoperate with raw DEFLATE", async () => {
  const { compress_url_data, decompress_url_data } = loadURLHelpers();
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
  const { compress_url_data, decompress_url_data } = loadURLHelpers();
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
  const { compress_url_data, decompress_url_data } = loadURLHelpers();
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
  const { compress_url_data } = loadURLHelpers({ CompressionStream: undefined });
  await assert.rejects(compress_url_data("text"), { name: "TypeError" });
  const token = deflateRawSync(Buffer.from("text")).toString("base64url");
  const { decompress_url_data } = loadURLHelpers({ DecompressionStream: undefined });
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
