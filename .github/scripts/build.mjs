/**
 * @file Package tracked runtime files, minify authored assets, and generate release notes/checksums.
 * Run npm --prefix .github ci, then node .github/scripts/build.mjs --tag v0.0.0-local.
 * --offline uses local esbuild only.
 * Runtime libraries remain independent of this private build toolchain.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { transform } from "esbuild";
import { zipSync } from "fflate";
import { buildEditions } from "./editions.mjs";
import { config, dist, finishBuild, git, releaseChangelog, root, sha256, validateTag } from "./release.mjs";

/**
 * Prefer jsDelivr's generated minification of the exact committed source; edited files stay local.
 * @param {string} file Repository-relative authored JS/CSS filename.
 * @param {Buffer} source Current bytes.
 * @param {string} commit Exact source commit.
 * @param {Object} [options={}] Optional offline switch and injectable HTTP implementation for tests.
 * @returns {Promise<{bytes: Buffer, provider: string, url: string|null}>} Minified bytes and provenance.
 */
export async function minified(file, source, commit, { offline = false, request = fetch } = {}) {
  const loader = path.extname(file).slice(1);
  const url = `https://cdn.jsdelivr.net/gh/${config.repository}@${commit}/${file.replace(/\.(js|css)$/, ".min.$1")}`;
  if (!offline) {
    try {
      const committed = execFileSync("git", ["show", `${commit}:${file}`], { cwd: root, stdio: ["ignore", "pipe", "ignore"], maxBuffer: 20 * 1024 * 1024 });
      if (committed.toString().replaceAll("\r\n", "\n") === source.toString().replaceAll("\r\n", "\n")) {
        const response = await request(url, { signal: AbortSignal.timeout(5000), redirect: "error" });
        if (response.ok && !response.headers.get("content-type")?.includes("text/html")) {
          const body = Buffer.from(await response.arrayBuffer());
          assert.ok(body.length > 0 && body.length <= 20 * 1024 * 1024, "Invalid CDN response size");
          await transform(body.toString(), { loader, logLevel: "silent" });
          return {
            bytes: Buffer.from(
              body
                .toString()
                .replace(/\n?\/\/[#@] sourceMappingURL=.*$/gm, "")
                .replace(/\/\*[#@] sourceMappingURL=[\s\S]*?\*\//g, "")
            ),
            provider: "jsdelivr",
            url
          };
        }
      }
    } catch {
      // CDN failures, unpublished commits, and mismatched local sources use the local compiler.
    }
  }
  const result = await transform(source.toString(), { loader, minify: true, legalComments: "inline", target: "es2020", charset: "utf8", logLevel: "silent" });
  return { bytes: Buffer.from(result.code), provider: "esbuild", url: null };
}

/**
 * Build regular/minified runtime ZIPs from explicit tracked paths.
 * @param {string} tag Valid release or preview version.
 * @param {Object} [options={}] Optional offline switch.
 * @returns {Promise<void>} Writes only dist build outputs.
 */
export async function buildRelease(tag, options = {}) {
  validateTag(tag);
  const changelog = releaseChangelog(tag);
  const manifest = { generator: `${config.repository} release builder`, repository: config.repository, tag, changelog, minification: [], assets: [], packages: [] };
  const tracked = git("ls-files", "-z").split("\0").filter(Boolean);
  const selected = [...new Set([...config.files, ...tracked.filter((file) => config.directories.some((directory) => file.startsWith(`${directory}/`)) || /^_[^/]+\.(js|css|php|html)$/.test(file))])];
  assert.ok(selected.length > 2, "No runtime files found");
  const regular = {};
  const compressed = {};
  for (const file of selected.sort()) {
    assert.ok(tracked.includes(file) || config.files.includes(file), `Only declared runtime files may be packaged: ${file}`);
    assert.ok(!file.split("/").some((part) => part === ".." || part === "node_modules" || part === ".git" || part === "vendor" || part === "__tests__"), `Unsafe runtime path: ${file}`);
    assert.ok(!(await fs.lstat(path.join(root, file))).isSymbolicLink(), `Symlinks cannot be packaged: ${file}`);
    const bytes = await fs.readFile(path.join(root, file));
    regular[file] = bytes;
    compressed[file] = bytes;
    const authored = config.kind === "easy" ? config.runtime.includes(file) : config.kind === "spa" && /^_[^/]+\.(js|css)$/.test(file);
    if (!authored) continue;
    const result = await minified(file, bytes, changelog.commit, options);
    const name = config.kind === "easy" ? file.replace(/\.(js|css)$/, ".min.$1") : file;
    delete compressed[file];
    compressed[name] = result.bytes;
    manifest.minification.push({ source: file, file: name, provider: result.provider, url: result.url, sha256: sha256(result.bytes) });
  }
  await fs.mkdir(dist, { recursive: true });
  const staging = await fs.mkdtemp(path.join(dist, ".release-"));
  try {
    /** @param {string} variant Package name. @param {Object} entries Relative filenames and bytes. @param {string} description Download explanation. @returns {Promise<void>} */
    async function archive(variant, entries, description) {
      const file = `${config.repository.split("/")[1]}.${tag}${variant === "regular" ? "" : `.${variant}`}.zip`;
      const body = Buffer.from(zipSync(Object.fromEntries(Object.entries(entries).map(([name, bytes]) => [name, [new Uint8Array(bytes), { mtime: new Date(1980, 0, 1) }]])), { level: 9 }));
      await fs.writeFile(path.join(staging, file), body);
      manifest.assets.push({ file, bytes: body.length, sha256: sha256(body), description });
      manifest.packages.push({ file, variant, files: Object.entries(entries).map(([name, bytes]) => ({ file: name, bytes: bytes.length, sha256: sha256(bytes) })) });
    }
    await archive("regular", regular, "Original files");
    await archive("minified", compressed, "Minified files");
    const editions = await buildEditions(compressed, staging);
    manifest.editions = editions.inventory;
    for (const asset of editions.assets) {
      await fs.writeFile(path.join(staging, asset.file), asset.body);
      manifest.assets.push({ file: asset.file, bytes: asset.body.length, sha256: sha256(asset.body), description: asset.description, format: asset.format });
    }
    await archive("bundled", editions.bundled, "Core bundles with a separate demo/");
    await archive("complete", editions.complete, "[EXPERIMENTAL] Complete framework with a separate demo/");
    await finishBuild(staging, manifest);
  } finally {
    assert.equal(path.dirname(staging), dist);
    await fs.rm(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { tag: { type: "string" }, offline: { type: "boolean" } } });
  await buildRelease(values.tag || process.env.RELEASE_TAG || "v0.0.0-local", values);
}
