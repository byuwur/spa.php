/** @file Test the reusable bundle/complete editions through real applications in separate demo/ folders. */
import { unzipSync } from "fflate";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";
import { config, dist, sha256 } from "../scripts/release.mjs";

const manifest = JSON.parse(await fs.readFile(path.join(dist, "assets/manifest.json"), "utf8"));
const php = config.repository.endsWith("/spa.php");

// ===== EDITION ARCHIVES =====
for (const variant of ["bundled", "complete"])
  test(`${variant} framework works in a separate application`, { timeout: 60000 }, async () => {
    const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "spa-edition-test-"));
    let browser, server, phpServer, echoServer;
    let phpOutput = "";
    try {
      const archive = manifest.packages.find((item) => item.variant === variant);
      assert.ok(archive);
      const entries = unzipSync(await fs.readFile(path.join(dist, "assets", archive.file)));
      assert.deepEqual(Object.keys(entries).sort(), archive.files.map((item) => item.file).sort());
      for (const file of archive.files) {
        assert.ok(!path.isAbsolute(file.file) && !file.file.split("/").includes(".."));
        assert.equal(sha256(entries[file.file]), file.sha256);
        const target = path.join(temporary, file.file);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, entries[file.file]);
      }
      if (variant === "complete") {
        const framework = php ? "spa.complete.php" : "spa.complete.js";
        assert.deepEqual(
          Object.keys(entries).filter((file) => !file.startsWith("demo/") && !["README.md", "LICENSE.md"].includes(file)),
          [framework]
        );
      }
      const script = variant === "complete" ? (php ? "../spa.complete.php?asset=spa.complete.js" : "../spa.complete.js") : "../spa.bundle.js";
      const routes = '{ "/": { URI: "/release-page.EXT" }, "/next": { URI: "/release-next.EXT" } }'.replaceAll("EXT", php ? "php" : "html");
      let bootstrap;
      if (php) {
        const framework = variant === "complete" ? 'byspa_framework_path() . "/' : '"../';
        bootstrap = `<?php
        ${variant === "complete" ? 'require_once __DIR__ . "/../spa.complete.php";' : ""}
        $setLocalStorage = true;
        require "./_init.php";
        require ${framework}_functions.php";
        require ${framework}_common.php";
        $routes = ["/" => ["URI" => "/release-page.php"], "/next" => ["URI" => "/release-next.php"]];
        require ${framework}_router.php";
      ?>`;
      } else {
        bootstrap = `<script src="./_init.js"></script>
      <script>
        bySPA.ROUTES = ${routes};
        byStorage.setItem("ROUTES", JSON.stringify(bySPA.ROUTES));
      </script>`;
      }
      await fs.writeFile(
        path.join(temporary, "demo", `release-test.${php ? "php" : "html"}`),
        `<!doctype html>
      ${php ? bootstrap : ""}
      <head>
        <meta charset="UTF-8" />
        ${variant === "bundled" ? '<link rel="stylesheet" href="../spa.bundle.css" />\n<script src="../js/jquery.min.js"></script>' : ""}
        ${!php ? bootstrap : ""}
        <script src="${script}" defer></script>
      </head>
      <body>
        <div id="spa-loader"></div>
        <main id="spa-content"></main>
        <div id="particles"></div>
      </body>`
      );
      const extension = php ? "php" : "html";
      // ===== DEMO PAGES =====
      for (const [name, label] of [
        ["page", "Ready"],
        ["next", "Next"]
      ])
        await fs.writeFile(
          path.join(temporary, "demo", `release-${name}.${extension}`),
          `<p id="edition-content">${label}</p>
      <script>
        window.editionRuns = (window.editionRuns || 0) + 1;
      </script>`
        );

      server = http.createServer(async (request, response) => {
        const relative = decodeURIComponent(new URL(request.url, "http://localhost").pathname).slice(1);
        const target = path.resolve(temporary, relative);
        if (!target.startsWith(`${temporary}${path.sep}`)) {
          response.writeHead(404).end();
          return;
        }
        try {
          const body = await fs.readFile(target);
          const type =
            {
              ".js": "text/javascript",
              ".css": "text/css",
              ".json": "application/json",
              ".woff2": "font/woff2",
              ".ttf": "font/ttf",
              ".png": "image/png",
              ".svg": "image/svg+xml"
            }[path.extname(target)] || "text/html";
          response.writeHead(200, { "content-type": type }).end(body);
        } catch {
          response.writeHead(404).end();
        }
      });
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = server.address().port;
      const origin = `http://127.0.0.1:${port}`;
      if (php) {
        await new Promise((resolve) => server.close(resolve));
        server = null;
        phpServer = spawn(process.env.PHP_BINARY || "php", ["-d", "phar.readonly=1", "-d", "display_errors=stderr", "-S", `127.0.0.1:${port}`, "-t", temporary], { cwd: temporary, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
        phpServer.stdout.on("data", (bytes) => {
          phpOutput += bytes;
        });
        phpServer.stderr.on("data", (bytes) => {
          phpOutput += bytes;
        });
        let ready = false;
        for (let attempt = 0; attempt < 50; attempt++) {
          try {
            await fetch(`${origin}/not-found`);
            ready = true;
            break;
          } catch {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        assert.ok(ready, phpOutput);
      }
      browser = await chromium.launch({
        channel: process.env.BROWSER_CHANNEL || process.env.PLAYWRIGHT_CHANNEL,
        timeout: 10000
      });
      const page = await browser.newPage();
      page.setDefaultTimeout(10000);
      const errors = [],
        external = [],
        requests = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/*", (route) => {
        const url = route.request().url();
        requests.push(url);
        if (!url.startsWith(origin) && /^https?:/.test(url)) {
          external.push(url);
          return route.abort();
        }
        return route.continue();
      });
      await page.goto(`${origin}/demo/release-test.${extension}${php ? "?uri=/" : "#/"}`);
      await page.waitForSelector("#edition-content");
      assert.equal(await page.locator("#edition-content").textContent(), "Ready");
      await page.evaluate(async () => bySPA.load("/next"));
      assert.equal(await page.locator("#edition-content").textContent(), "Next");
      assert.equal(await page.evaluate(() => window.editionRuns), 2);
      assert.equal(await page.evaluate(() => typeof byLoad === "function" && typeof escape_html === "function" && bySPA.initialized && byCommon.initialized), true);
      assert.equal(await page.evaluate(() => typeof byCommon.initPrivacyControls), "function");
      if (variant === "complete") {
        assert.equal(await page.evaluate(() => Boolean($.fn.select2 && $.fn.draggable && window.bootstrap && window.gsap && window.MorphSVGPlugin)), true);
        assert.equal(await page.locator('style[data-source$="complete styles"]').count(), 1);
        assert.ok(!requests.some((url) => /\.(?:css|woff2?|ttf|png)(?:\?|$)/.test(url)), "Framework CSS/fonts/images must be embedded");
        if (php) {
          for (const asset of ["_functions.php", ".env", "%2e%2e/_functions.php"]) assert.equal((await fetch(`${origin}/spa.complete.php?asset=${asset}`)).status, 404);
          assert.equal((await fetch(`${origin}/spa.complete.php?asset=_error.php&probe=1`)).status, 204);
        }
      }
      const demoPage = await browser.newPage();
      demoPage.setDefaultTimeout(10000);
      const demoErrors = [],
        demoExternal = [];
      demoPage.on("pageerror", (error) => demoErrors.push(error.message));
      await demoPage.route("**/*", (route) => {
        const url = route.request().url();
        if (!url.startsWith(origin) && /^https?:/.test(url)) {
          demoExternal.push(url);
          return route.abort();
        }
        return route.continue();
      });
      await demoPage.goto(`${origin}/demo/${php ? "home.php?uri=/" : "index.html#/"}`);
      await demoPage.waitForSelector("#home-title");
      await demoPage.evaluate(async () => bySPA.load("/page"));
      assert.equal(await demoPage.locator("#home-title").count(), 0);
      assert.ok((await demoPage.locator("#spa-content").textContent()).trim().length > 0);
      assert.deepEqual(demoErrors, []);
      if (variant === "complete") assert.deepEqual(demoExternal, []);
      await demoPage.close();
      if (php && variant === "complete") {
        let requests = 0;
        echoServer = http.createServer((request, response) => {
          requests++;
          assert.equal(request.method, "POST");
          response.end("Archived helper request succeeded");
        });
        await new Promise((resolve) => echoServer.listen(0, "127.0.0.1", resolve));
        await fs.writeFile(
          path.join(temporary, "demo/release-http.php"),
          `<?php
        require_once __DIR__ . "/../spa.complete.php";
        require_once byspa_framework_path() . "/_functions.php";
        $TO_HOME = ".";
        $SYSTEM_ROOT = __DIR__;
        echo make_http_request("http://127.0.0.1:${echoServer.address().port}/", [], ["message" => "test"]);
      `
        );
        assert.equal(await (await fetch(`${origin}/demo/release-http.php`)).text(), "Archived helper request succeeded");
        assert.equal(requests, 1);
      }
      await page.evaluate(async () => bySPA.load("/not-a-release-route"));
      await page.waitForFunction(() => document.title.includes("404"));
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
    } catch (error) {
      if (phpOutput) console.error(phpOutput.slice(-6000));
      throw error;
    } finally {
      await browser?.close();
      if (echoServer) await new Promise((resolve) => echoServer.close(resolve));
      if (server) await new Promise((resolve) => server.close(resolve));
      if (phpServer) {
        phpServer.kill();
        await new Promise((resolve) => (phpServer.exitCode !== null ? resolve() : phpServer.once("exit", resolve)));
      }
      assert.equal(path.dirname(temporary), path.resolve(os.tmpdir()));
      await fs.rm(temporary, { recursive: true, force: true });
    }
  });
