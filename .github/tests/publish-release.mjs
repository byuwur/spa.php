import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { dist, publishRelease, sha256 } from "../scripts/release.mjs";

const directory = path.join(dist, "assets");
const manifest = JSON.parse(await fs.readFile(path.join(directory, "manifest.json"), "utf8"));
const environment = {
  GITHUB_REPOSITORY: manifest.repository,
  GITHUB_REF_TYPE: "tag",
  GITHUB_REF_NAME: manifest.tag,
  GITHUB_SHA: manifest.changelog.commit,
  GH_TOKEN: "mock-token"
};

// =============
// TEST FIXTURES
// =============
function github({ failUpload = 0, published = false, foreign = false, starter = false } = {}) {
  let release = published ? { id: 1, draft: false } : null;
  const assets = [];
  const calls = [];
  let uploads = 0;
  const json = (value, status = 200) =>
    new Response(JSON.stringify(value), {
      status,
      headers: { "content-type": "application/json" }
    });
  return {
    calls,
    assets,
    get release() {
      return release;
    },
    async request(url, options = {}) {
      const method = options.method || "GET";
      calls.push({ method, url });
      if (url.includes("/releases/tags/")) return release ? json(release) : json({}, 404);
      if (method === "POST" && url.endsWith("/releases")) {
        release = { id: 1, ...JSON.parse(options.body) };
        if (foreign) release.body = "Another user's draft";
        return json(release, 201);
      }
      if (method === "GET" && url.includes("/assets?")) {
        const page = Number(new URL(url).searchParams.get("page"));
        return json(assets.slice((page - 1) * 100, page * 100));
      }
      if (method === "DELETE") {
        assets.splice(
          assets.findIndex((asset) => String(asset.id) === url.split("/").at(-1)),
          1
        );
        return new Response(null, { status: 204 });
      }
      if (method === "POST" && url.startsWith("https://uploads.github.com/")) {
        uploads++;
        if (uploads === failUpload) {
          if (starter)
            assets.push({
              id: 1000,
              name: new URL(url).searchParams.get("name"),
              size: 0,
              state: "starter"
            });
          return json({ message: "Simulated interrupted upload" }, 503);
        }
        const asset = {
          id: uploads,
          name: new URL(url).searchParams.get("name"),
          size: options.body.length,
          digest: `sha256:${sha256(options.body)}`,
          state: "uploaded"
        };
        assets.push(asset);
        return json(asset, 201);
      }
      if (method === "PATCH") {
        Object.assign(release, JSON.parse(options.body));
        return json(release);
      }
      throw new Error(`Unexpected mock request: ${method} ${url}`);
    }
  };
}

// =====================
// PUBLISH RELEASE TESTS
// =====================
test("a failed upload stays private, and a rerun resumes matching assets without replacement", async () => {
  const remote = github({ failUpload: 3, starter: true });
  await assert.rejects(publishRelease({ request: remote.request, environment, directory }), /release remains a draft/);
  assert.equal(remote.release.draft, true);
  assert.equal(remote.assets.length, 3);
  assert.ok(!remote.calls.some((call) => call.method === "PATCH"));
  await publishRelease({ request: remote.request, environment, directory });
  assert.equal(remote.release.draft, false);
  assert.equal(remote.assets.length, (await fs.readdir(directory)).length);
  assert.equal(new Set(remote.assets.map((asset) => asset.name)).size, remote.assets.length);
  assert.equal(remote.calls.filter((call) => call.method === "DELETE").length, 1);
  assert.equal(remote.calls.filter((call) => call.method === "PATCH").length, 1);
  assert.equal(remote.release.prerelease, manifest.tag.split("+")[0].includes("-"));
  const count = remote.calls.length;
  await assert.rejects(publishRelease({ request: remote.request, environment, directory }), /already published/);
  assert.equal(remote.calls.length, count + 1, "Published reruns only read the release");
});

test("foreign drafts, conflicting assets, and non-tag invocations cannot be published", async () => {
  const remote = github({ failUpload: 2, foreign: true });
  await assert.rejects(publishRelease({ request: remote.request, environment, directory }));
  await assert.rejects(publishRelease({ request: remote.request, environment, directory }), /different provenance/);
  assert.equal(remote.release.draft, true);
  const conflict = github({ failUpload: 2 });
  await assert.rejects(publishRelease({ request: conflict.request, environment, directory }));
  conflict.assets[0].digest = `sha256:${"0".repeat(64)}`;
  await assert.rejects(publishRelease({ request: conflict.request, environment, directory }), /Conflicting draft asset/);
  const untouched = github();
  await assert.rejects(
    publishRelease({
      request: untouched.request,
      environment: { ...environment, GITHUB_REF_TYPE: "branch" },
      directory
    })
  );
  assert.deepEqual(untouched.calls, []);
});

test("changed source identity and unexpected or corrupted artifacts stop before HTTP writes", async () => {
  const temporary = await fs.mkdtemp(path.join((await import("node:os")).tmpdir(), "release-provenance-"));
  try {
    const remote = github();
    await assert.rejects(
      publishRelease({
        request: remote.request,
        environment: { ...environment, GITHUB_SHA: "0".repeat(40) },
        directory
      }),
      /exact tagged commit/
    );
    await fs.cp(directory, temporary, { recursive: true });
    await fs.writeFile(path.join(temporary, "unexpected.txt"), "unrelated");
    await assert.rejects(publishRelease({ request: remote.request, environment, directory: temporary }), /unexpected files/);
    await fs.unlink(path.join(temporary, "unexpected.txt"));
    await fs.appendFile(path.join(temporary, manifest.assets[0].file), "corruption");
    await assert.rejects(publishRelease({ request: remote.request, environment, directory: temporary }), /Changed tested artifact/);
    assert.deepEqual(remote.calls, []);
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});
