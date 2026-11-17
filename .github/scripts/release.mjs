/**
 * @file Generate release history, validate pushed tags, and publish verified artifacts through a draft.
 * Configuration lives in ../release.json. This module uses only Node built-ins.
 * Run --check in the read-only tag job and --publish after downloading the tested build.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

export const root = fileURLToPath(new URL("../../", import.meta.url));
export const dist = path.join(root, "dist");
export const config = JSON.parse(await fs.readFile(new URL("../release.json", import.meta.url), "utf8"));

/** @param {Uint8Array|string} bytes Artifact bytes. @returns {string} SHA-256 hex digest. */
export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** @param {...string} args Git arguments. @returns {string} Trimmed UTF-8 output from this checkout. */
export const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }).trim();

/**
 * Accept the repositories' established two-part tags and three-part SemVer tags.
 * @param {string} tag Version beginning with v, with optional prerelease/build identifiers.
 * @returns {string} Validated tag, safe for artifact names and URLs.
 * @throws {Error} Rejects unsafe or malformed versions.
 */
export function validateTag(tag) {
  const number = "(?:0|[1-9][0-9]*)";
  const identifier = "(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)";
  assert.match(tag, new RegExp(`^v${number}\\.${number}(?:\\.${number})?(?:-${identifier}(?:\\.${identifier})*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$`), `Invalid release tag: ${tag}`);
  return tag;
}

/** @param {string} tag Release/preview tag. @param {string} [directory=root] Git checkout. @returns {Object} Previous tag, exact commit, display ref, and real commit subjects. */
export function releaseChangelog(tag, directory = root) {
  /**
   * @param {...string} args Git arguments.
   * @returns {string} Trimmed UTF-8 command output.
   */
  const git = (...args) => execFileSync("git", args, { cwd: directory, encoding: "utf8" }).trim();
  const commit = git("rev-parse", "HEAD");
  const previous = git("describe", "--tags", "--abbrev=0", "--always", "--match", "v[0-9]*", `--exclude=${tag}`, commit);
  const previousTag = previous.startsWith("v") ? previous : null;
  const ref = git("tag", "--points-at", commit).split("\n").includes(tag) ? tag : commit;
  const log = git("log", "--format=%H%x00%s", previousTag ? `${previousTag}..${commit}` : commit);
  const commits = log
    ? log.split("\n").map((line) => {
        const [sha, subject] = line.split("\0");
        return { sha, subject };
      })
    : [];
  return { previousTag, commit, ref, commits };
}

/**
 * Render the real Git range, linked short hashes, plain commit subjects, and package explanations.
 * @param {Object} manifest Build identity and asset inventory.
 * @returns {string} Markdown for the release body and local preview.
 */
export function releaseNotes(manifest) {
  const repository = `https://github.com/${config.repository}`;
  const { previousTag, ref, commits } = manifest.changelog;
  const lines = [`# ${config.repository.split("/")[1]} ${manifest.tag}`, "", "## Changes", ""];
  for (const commit of commits) lines.push(`- ([${commit.sha.slice(0, 7)}](${repository}/commit/${commit.sha})) ${commit.subject.replace(/[\\`*_\[\]<>&]/g, "\\$&")}`);
  if (!commits.length) lines.push("There are no new commits in this range.");
  const range = previousTag ? `${previousTag}...${ref}` : ref;
  const url = previousTag ? `${repository}/compare/${encodeURIComponent(previousTag)}...${encodeURIComponent(ref)}` : `${repository}/commits/${encodeURIComponent(ref)}`;
  lines.push("", `[Full changelog (${range})](${url})`);
  if (config.kind !== "history") {
    lines.push("", "## Downloads", "", "| File | Contents |", "| --- | --- |");
    for (const asset of manifest.assets.filter((item) => item.file !== "RELEASE_NOTES.md")) {
      lines.push(`| [${asset.file}](${repository}/releases/download/${encodeURIComponent(manifest.tag)}/${asset.file}) | ${asset.description.replaceAll("|", "&#124;")} |`);
    }
    for (const note of config.notes) lines.push("", note);
    lines.push("", `[Manifest](${repository}/releases/download/${encodeURIComponent(manifest.tag)}/manifest.json) · [Checksums](${repository}/releases/download/${encodeURIComponent(manifest.tag)}/SHA256SUMS).`);
  }

  return `${lines.join("\n")}\n`;
}

/**
 * Write notes, provenance and complete checksums, then replace only a known build directory.
 * @param {string} staging Temporary directory under dist created by the caller.
 * @param {Object} manifest Artifact inventory before adding generated notes.
 * @returns {Promise<void>} Finalizes dist/assets and mirrors its notes to dist/RELEASE_NOTES.md.
 */
export async function finishBuild(staging, manifest) {
  const notes = Buffer.from(releaseNotes(manifest));
  await fs.writeFile(path.join(staging, "RELEASE_NOTES.md"), notes);
  manifest.assets.push({ file: "RELEASE_NOTES.md", bytes: notes.length, sha256: sha256(notes), description: "Release notes" });
  await fs.writeFile(path.join(staging, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const files = [...manifest.assets, { file: "manifest.json", sha256: sha256(await fs.readFile(path.join(staging, "manifest.json"))) }].sort((a, b) => a.file.localeCompare(b.file, "en"));
  await fs.writeFile(path.join(staging, "SHA256SUMS"), `${files.map((file) => `${file.sha256}  ${file.file}`).join("\n")}\n`);
  const destination = path.join(dist, "assets");
  try {
    const previous = JSON.parse(await fs.readFile(path.join(destination, "manifest.json"), "utf8"));
    assert.equal(previous.generator, `${config.repository} release builder`);
    assert.deepEqual((await fs.readdir(destination)).sort(), [...previous.assets.map((asset) => asset.file), "manifest.json", "SHA256SUMS"].sort(), "Unexpected output files; leave them untouched");
    for (const file of [...previous.assets.map((asset) => asset.file), "manifest.json", "SHA256SUMS"]) {
      assert.equal(path.basename(file), file);
      await fs.unlink(path.join(destination, file));
    }
    await fs.rmdir(destination);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    // An existing directory without our manifest must not be removed or replaced.
    await assert.rejects(fs.stat(destination), { code: "ENOENT" });
  }
  await fs.rename(staging, destination);
  await fs.copyFile(path.join(destination, "RELEASE_NOTES.md"), path.join(dist, "RELEASE_NOTES.md"));
  console.log(`Built ${config.repository} ${manifest.tag} in dist/assets`);
}

/** @returns {Promise<void>} Validates repository, pushed tag, exact checkout, main ancestry and draft ownership. */
export async function checkRelease() {
  assert.equal(process.env.GITHUB_REPOSITORY, config.repository, "Release workflow must run in the owning repository");
  assert.equal(process.env.GITHUB_REF_TYPE, "tag", "Only pushed tags can publish");
  const tag = validateTag(process.env.GITHUB_REF_NAME || "");
  /**
   * @param {...string} args Git arguments.
   * @returns {string} Trimmed UTF-8 command output.
   */
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const commit = git("rev-parse", `${tag}^{commit}`);
  assert.equal(process.env.GITHUB_SHA, commit, "Workflow identity must match the tagged commit");
  assert.equal(git("rev-parse", "HEAD"), commit, "Checkout must match the exact tagged commit");
  execFileSync("git", ["merge-base", "--is-ancestor", commit, `refs/remotes/origin/${config.branch}`], { cwd: root });
  const response = await fetch(`https://api.github.com/repos/${config.repository}/releases/tags/${encodeURIComponent(tag)}`, {
    headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    signal: AbortSignal.timeout(30000)
  });
  if (response.status !== 404) {
    assert.ok(response.ok, `Unable to verify existing release: HTTP ${response.status}`);
    const release = await response.json();
    assert.ok(release.draft, `Release ${tag} is already published; it will not be overwritten`);
    assert.ok(release.body?.includes(`<!-- ${config.repository} release builder ${tag} ${commit} `), "Existing draft belongs to another publication; leave it untouched");
  }
  console.log(`Validated ${tag} at ${commit} on ${config.branch}`);
}

/** @param {Object} [options={}] Injectable request, environment, and tested directory. @returns {Promise<void>} Publishes only an intact tested inventory into its matching draft. */
export async function publishRelease({ request = fetch, environment = process.env, directory = path.join(dist, "assets") } = {}) {
  assert.equal(environment.GITHUB_REPOSITORY, config.repository);
  assert.equal(environment.GITHUB_REF_TYPE, "tag");
  const tag = validateTag(environment.GITHUB_REF_NAME || "");
  assert.match(environment.GITHUB_SHA || "", /^[0-9a-f]{40}$/);
  assert.ok(environment.GH_TOKEN, "A GitHub token is required");
  const rawManifest = await fs.readFile(path.join(directory, "manifest.json"));
  const manifest = JSON.parse(rawManifest);
  assert.equal(manifest.repository, config.repository);
  assert.equal(manifest.generator, `${config.repository} release builder`);
  assert.equal(manifest.tag, tag);
  assert.equal(manifest.changelog.commit, environment.GITHUB_SHA, "Artifacts must belong to the exact tagged commit");
  const files = [...manifest.assets.map((asset) => asset.file), "manifest.json", "SHA256SUMS"].sort();
  assert.deepEqual((await fs.readdir(directory)).sort(), files, "Refusing to upload unexpected files");
  const bodies = new Map();
  for (const file of files) {
    assert.equal(path.basename(file), file);
    const body = await fs.readFile(path.join(directory, file));
    const asset = manifest.assets.find((item) => item.file === file);
    if (asset) assert.equal(sha256(body), asset.sha256, `Changed tested artifact: ${file}`);
    bodies.set(file, body);
  }
  for (const line of bodies.get("SHA256SUMS").toString().trim().split("\n")) {
    const [hash, file] = line.split("  ");
    assert.ok(bodies.has(file), `Unknown checksum file: ${file}`);
    assert.equal(sha256(bodies.get(file)), hash, `Checksum mismatch: ${file}`);
  }
  const marker = `<!-- ${config.repository} release builder ${tag} ${environment.GITHUB_SHA} ${sha256(rawManifest)} -->`;
  const body = `${bodies.get("RELEASE_NOTES.md").toString()}\n${marker}\n`;
  const base = `https://api.github.com/repos/${config.repository}`;
  const headers = { Authorization: `Bearer ${environment.GH_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  /**
   * Send an authenticated GitHub JSON request for this publication.
   * @param {string} url API endpoint.
   * @param {string} [method="GET"] HTTP method.
   * @param {Object} [data] JSON request body.
   * @returns {Promise<Object|Array|null>} Parsed response, or null for HTTP 204.
   * @throws {Error} Rejects HTTP failures and invalid JSON responses.
   */
  async function api(url, method = "GET", data) {
    const response = await request(url, { method, headers: { ...headers, "content-type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${method} ${url}: HTTP ${response.status} ${(await response.text()).slice(0, 500)}`);
    return response.status === 204 ? null : response.json();
  }
  const lookup = await request(`${base}/releases/tags/${encodeURIComponent(tag)}`, { headers, signal: AbortSignal.timeout(30000) });
  let release;
  if (lookup.status === 404) {
    release = await api(`${base}/releases`, "POST", { tag_name: tag, target_commitish: environment.GITHUB_SHA, name: tag, body, draft: true, prerelease: tag.split("+")[0].includes("-") });
  } else {
    assert.ok(lookup.ok, `Release lookup failed: HTTP ${lookup.status}`);
    release = await lookup.json();
    assert.ok(release.draft, "An already published release will never be overwritten");
    assert.ok(release.body?.includes(marker), "Existing draft has different provenance or artifacts; leave it untouched");
  }
  assert.ok(release.draft, "Assets may only be uploaded to a draft");
  /** @returns {Promise<Array<Object>>} Every draft asset across GitHub's paginated inventory. */
  async function listAssets() {
    const result = [];
    for (let page = 1; ; page++) {
      const chunk = await api(`${base}/releases/${release.id}/assets?per_page=100&page=${page}`);
      result.push(...chunk);
      if (chunk.length < 100) return result;
    }
  }
  if (config.kind === "history") {
    assert.deepEqual(await listAssets(), [], "History-only releases cannot contain assets");
    await api(`${base}/releases/${release.id}`, "PATCH", { name: tag, draft: false });
    console.log(`Published ${config.repository} ${tag} commit history`);
    return;
  }
  let uploaded = await listAssets();
  assert.ok(
    uploaded.every((asset) => files.includes(asset.name)),
    "Existing draft contains unrelated assets"
  );
  for (const file of files) {
    const bytes = bodies.get(file);
    let existing = uploaded.find((asset) => asset.name === file);
    // GitHub can leave an empty starter placeholder after an interrupted upload.
    // Only remove that placeholder from an identical automation-owned draft.
    if (existing?.state === "starter" && existing.size === 0) {
      await api(`${base}/releases/assets/${existing.id}`, "DELETE");
      existing = undefined;
    }
    if (existing) {
      assert.equal(existing.size, bytes.length, `Conflicting draft asset: ${file}`);
      assert.equal(existing.digest, `sha256:${sha256(bytes)}`, `Conflicting draft asset: ${file}`);
      continue;
    }
    const response = await request(`https://uploads.github.com/repos/${config.repository}/releases/${release.id}/assets?name=${encodeURIComponent(file)}`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/octet-stream" },
      body: bytes,
      signal: AbortSignal.timeout(120000)
    });
    assert.ok(response.ok, `Upload ${file}: HTTP ${response.status}; the release remains a draft and can be rerun`);
  }
  uploaded = await listAssets();
  assert.deepEqual(uploaded.map((asset) => asset.name).sort(), files, "Incomplete draft; publication stopped");
  for (const asset of uploaded) {
    assert.equal(asset.size, bodies.get(asset.name).length);
    assert.equal(asset.digest, `sha256:${sha256(bodies.get(asset.name))}`, `Uploaded integrity mismatch: ${asset.name}`);
  }
  await api(`${base}/releases/${release.id}`, "PATCH", { name: tag, draft: false });
  console.log(`Published ${config.repository} ${tag} with ${files.length} verified assets`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { tag: { type: "string" }, check: { type: "boolean" }, publish: { type: "boolean" } } });
  assert.ok(!(values.check && values.publish), "Choose --check or --publish");
  if (values.check) await checkRelease();
  else if (values.publish) await publishRelease();
  else {
    assert.equal(config.kind, "history", "Use build.mjs to generate distribution packages");
    const tag = validateTag(values.tag || process.env.RELEASE_TAG || "v0.0.0-local");
    await fs.mkdir(dist, { recursive: true });
    const staging = await fs.mkdtemp(path.join(dist, ".release-"));
    await finishBuild(staging, { generator: `${config.repository} release builder`, repository: config.repository, tag, changelog: releaseChangelog(tag), assets: [] });
  }
}
