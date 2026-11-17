/** @file Verify archive bytes and execute the existing runtime checks against each extracted distribution. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { unzipSync } from "fflate";
import { config, dist, git, releaseNotes, root, sha256, validateTag } from "../scripts/release.mjs";
import { minified } from "../scripts/build.mjs";

const directory = path.join(dist, "assets");
const manifest = JSON.parse(await fs.readFile(path.join(directory, "manifest.json"), "utf8"));

test("checksums cover the complete inventory and the exact source commit", async () => {
  assert.equal(manifest.changelog.commit, git("rev-parse", "HEAD"));
  const files = [...manifest.assets.map((asset) => asset.file), "manifest.json"].sort();
  const checksums = (await fs.readFile(path.join(directory, "SHA256SUMS"), "utf8")).trim().split("\n");
  assert.deepEqual(checksums.map((line) => line.split("  ")[1]).sort(), files);
  assert.deepEqual((await fs.readdir(directory)).sort(), [...files, "SHA256SUMS"].sort());
  for (const line of checksums) {
    const [hash, file] = line.split("  ");
    assert.equal(sha256(await fs.readFile(path.join(directory, file))), hash);
  }
});

test("CDN preference, unavailable-CDN fallback, and local edits preserve source ownership", async () => {
  const file = config.kind === "easy" ? config.runtime.find((name) => name.endsWith(".js")) : "_load.js";
  const commit = manifest.changelog.commit;
  const source = execFileSync("git", ["show", `${commit}:${file}`], { cwd: root });
  const request = async (url) => {
    assert.ok(url.includes(`@${commit}/`));
    return new Response("/*! CDN fixture */ var releaseFixture=1;", { headers: { "content-type": "application/javascript" } });
  };
  assert.equal((await minified(file, source, commit, { request })).provider, "jsdelivr");
  assert.equal((await minified(file, source, commit, { request: async () => new Response("unavailable", { status: 404 }) })).provider, "esbuild");
  assert.equal((await minified(file, Buffer.concat([source, Buffer.from("\n// local edit")]), commit, { request: () => assert.fail("Edited source must never request CDN bytes") })).provider, "esbuild");
});

for (const archive of manifest.packages.filter((archive) => ["regular", "minified"].includes(archive.variant)))
  test(`package ${archive.variant} preserves runtime contracts`, { timeout: 120000 }, async () => {
    const entries = unzipSync(await fs.readFile(path.join(directory, archive.file)));
    assert.deepEqual(Object.keys(entries).sort(), archive.files.map((file) => file.file).sort());
    const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "release-package-"));
    try {
      const extracted = path.join(temporary, config.repository.split("/")[1]);
      for (const file of archive.files) {
        assert.ok(!file.file.startsWith("/") && !file.file.split("/").includes(".."));
        assert.equal(sha256(entries[file.file]), file.sha256);
        if (file.file.endsWith("/")) continue;
        const filename = config.kind === "easy" ? file.file.replace(/\.min\.(js|css)$/, ".$1") : file.file;
        const destination = path.join(extracted, filename);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, entries[file.file]);
        if (archive.variant === "regular" && file.file !== "README.md") assert.equal(file.sha256, sha256(await fs.readFile(path.join(root, file.file))));
      }
      await fs.cp(path.join(root, "__tests__"), path.join(extracted, "__tests__"), { recursive: true });
      for (const companion of config.companions || []) {
        const source = path.join(root, "..", companion);
        const target = path.join(temporary, companion);
        await fs.mkdir(target, { recursive: true });
        for (const file of await fs.readdir(source)) if (/\.(js|css)$/.test(file)) await fs.copyFile(path.join(source, file), path.join(target, file));
      }
      const environment = { ...process.env, SPA_JS_TREE: "", SPA_PHP_TREE: "", NODE_PATH: path.join(root, ".github/node_modules") };
      // Start an independent runner; inheriting NODE_TEST_CONTEXT uses the parent's internal protocol.
      delete environment.NODE_TEST_CONTEXT;
      // Internal-function fixtures rewrite readable source. Browser tests exercise actual minified navigation/scripts.
      const suites = config.tests.filter((name) => archive.variant === "regular" || !config.sourceTests.includes(name));
      const output = execFileSync(process.execPath, ["--test", "--test-reporter=tap", ...suites.map((name) => path.join(extracted, "__tests__", name))], {
        cwd: extracted,
        env: environment,
        timeout: 90000,
        encoding: "utf8",
        stdio: "pipe",
        maxBuffer: 4 * 1024 * 1024
      });
      assert.match(output, /# tests [1-9][0-9]*/);
      assert.match(output, /# fail 0/);
      assert.match(output, /# skipped 0/);
      console.log(`${archive.variant}: ${output.match(/# tests ([0-9]+)/)[1]} existing runtime checks passed`);
    } catch (error) {
      if (error.stdout) console.error(error.stdout.toString());
      if (error.stderr) console.error(error.stderr.toString());
      throw error;
    } finally {
      await fs.rm(temporary, { recursive: true, force: true });
    }
  });

test("release notes link short hashes, escape subjects, and display the actual tag", () => {
  const notes = releaseNotes({ ...manifest, changelog: { previousTag: "v1.0", ref: "v1.1", commits: [{ sha: "a".repeat(40), subject: "[Fix] Keep <markup> and *literal* text" }] } });
  assert.ok(notes.includes(`- ([aaaaaaa](https://github.com/${config.repository}/commit/${"a".repeat(40)})) \\[Fix\\] Keep \\<markup\\> and \\*literal\\* text`));
  assert.ok(notes.includes("/compare/v1.0...v1.1"));
  for (const tag of ["v1.0", "v1.0.1", "v1.0.1-rc.1"]) assert.equal(validateTag(tag), tag);
  for (const tag of ["main", "../v1.0", "v01.0", "v1.0-01"]) assert.throws(() => validateTag(tag));
});
