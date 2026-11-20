/** @file A failed generation must remove its private stage and preserve the previous output. */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
test("failed builds clean their private stage and preserve existing output", { timeout: 30000 }, async () => {
  // =========================
  // TEMPORARY RELEASE FIXTURE
  // =========================
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "release-cleanup-"));
  const modules = path.join(temporary, ".github/node_modules");
  let linked = false;
  try {
    await fs.cp(path.join(root, ".github/scripts"), path.join(temporary, ".github/scripts"), {
      recursive: true
    });
    let config;
    try {
      config = JSON.parse(await fs.readFile(path.join(root, ".github/release.json"), "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const stream = !config;
    const kind = config?.kind || "stream";
    if (config) {
      config = {
        ...config,
        runtime: ["fixture.js", "fixture.css"],
        files: ["README.md", "LICENSE.md"],
        directories: ["templates"],
        notes: []
      };
      await fs.writeFile(path.join(temporary, ".github/release.json"), JSON.stringify(config));
    }
    await fs.writeFile(path.join(temporary, ".gitignore"), ".github/node_modules/\ndist/\n");
    await fs.writeFile(path.join(temporary, "README.md"), "Cleanup fixture\n");
    await fs.writeFile(path.join(temporary, "LICENSE.md"), "Fixture license\n");
    await fs.writeFile(path.join(temporary, "fixture.js"), "window.cleanupFixture = true;\n");
    await fs.writeFile(path.join(temporary, "fixture.css"), "body { color: red; }\n");
    await fs.mkdir(path.join(temporary, "templates"));
    await fs.writeFile(path.join(temporary, "templates/default.json"), "{}\n");
    if (stream) {
      const source = await fs.readFile(path.join(root, "resource.js"), "utf8");
      await fs.writeFile(path.join(temporary, "resource.js"), source.match(/byStream\.SPA_VERSION = "[^"]+";/)[0]);
      await fs.mkdir(path.join(temporary, "fixture"));
      await fs.writeFile(path.join(temporary, "fixture/fixture.html"), '<html data-tool="fixture"><template id="overlay-markup"></template></html>');
    }
    const git = (...args) => execFileSync("git", ["-c", "user.name=Release cleanup tests", "-c", "user.email=release-tests@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: temporary, stdio: "pipe" });
    // ================
    // REPOSITORY SETUP
    // ================
    git("init", "--quiet", "--initial-branch=main");
    git("add", ".");
    git("commit", "--quiet", "-m", "Cleanup fixture");
    if (kind !== "history") {
      await fs.symlink(path.join(root, ".github/node_modules"), modules, process.platform === "win32" ? "junction" : "dir");
      linked = true;
    }
    const output = path.join(temporary, "dist/assets");
    await fs.mkdir(output, { recursive: true });
    if (stream) {
      const manifest = JSON.stringify({
        generator: "stream.html release builder",
        repository: "byuwur/stream.html",
        assets: []
      });
      await fs.writeFile(path.join(temporary, "dist/manifest.json"), manifest);
      await fs.writeFile(path.join(output, "manifest.json"), manifest);
      await fs.writeFile(path.join(output, "SHA256SUMS"), "Previous completed output\n");
    } else await fs.writeFile(path.join(output, "keep.txt"), "Previous completed output\n");
    const previous = Object.fromEntries(await Promise.all((await fs.readdir(output)).map(async (file) => [file, await fs.readFile(path.join(output, file), "utf8")])));
    const environment = { ...process.env };
    delete environment.NODE_TEST_CONTEXT;
    const command = kind === "history" ? ".github/scripts/release.mjs" : ".github/scripts/build.mjs";
    const args = [command, "--tag", "v0.0.0-cleanup", ...(["easy", "spa"].includes(kind) ? ["--offline"] : [])];
    // =========================
    // BUILD FAILURE AND CLEANUP
    // =========================
    const result = spawnSync(process.execPath, args, {
      cwd: temporary,
      env: environment,
      encoding: "utf8",
      timeout: 20000
    });
    assert.notEqual(result.status, 0, "The deliberately invalid fixture must fail");
    const diagnostic = `${result.stdout}${result.stderr}`;
    assert.match(diagnostic, kind === "spa" ? /buildEditions/ : stream ? /resources|fixture/i : /finishBuild/);
    assert.deepEqual(
      (await fs.readdir(path.join(temporary, "dist"))).filter((file) => file.startsWith(".release-")),
      [],
      "Failed generation left its private stage behind"
    );
    assert.deepEqual(Object.fromEntries(await Promise.all((await fs.readdir(output)).map(async (file) => [file, await fs.readFile(path.join(output, file), "utf8")]))), previous, "Previous output changed after a failed generation");
  } finally {
    if (linked) await fs.unlink(modules);
    assert.equal(path.dirname(temporary), path.resolve(os.tmpdir()));
    await fs.rm(temporary, { recursive: true, force: true });
  }
});
