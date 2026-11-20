/**
 * @file Generate reusable core bundles and complete framework editions with a separate demo/ application.
 * Complete JavaScript embeds all shipped browser libraries, CSS, fonts, and CSS images.
 * Application initializers, routes, pages, translations, media, credentials, and services remain application-owned.
 */
import { build, transform } from "esbuild";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs/promises";
import path from "node:path";
import { format } from "prettier";
import { config, root } from "./release.mjs";

// =============
// EDITION BUILD
// =============
/**
 * Produce bundle and complete edition files without changing the authored runtime.
 * @param {Object<string, Buffer>} files Minified framework/package files indexed by repository-relative path.
 * @param {string} staging Owned build staging directory.
 * @returns {Promise<Object>} Reusable assets, edition ZIP entries, and included dependency inventories.
 */
export async function buildEditions(files, staging) {
  const php = config.repository.endsWith("/spa.php");
  const core = ["_load.js", "_functions.js", "_fonts.js", "_transitions.js", "_common.js", "_privacy.js", ...(!php ? ["_lang.js", "_router.js"] : []), "_spa.js"];
  const libraries = [
    "jquery.min.js",
    "jquery-ui.min.js",
    "popper.min.js",
    "shards.min.js",
    "bootstrap.min.js",
    "swiper.min.js",
    "video.min.js",
    "select2.full.min.js",
    "pickr.min.js",
    "dropzone.min.js",
    "typed.min.js",
    "particles-ui.min.js",
    "cookies.min.js",
    "gsap.min.js",
    "morphSVGplugin.min.js"
  ].map((file) => `js/${file}`);
  assert.deepEqual(
    libraries.toSorted(),
    Object.keys(files)
      .filter((file) => /^js\/[^/]+\.js$/.test(file))
      .toSorted(),
    "Update the complete edition order when bundled libraries change"
  );
  const styles = ["animate.min.css", "fontawesome.min.css", "jquery-ui.min.css", "shards.css", "bootstrap.min.css", "swiper.min.css", "video.min.css", "select2.min.css", "pickr.min.css", "dropzone.min.css"].map((file) => `css/${file}`);
  assert.deepEqual(
    styles.toSorted(),
    Object.keys(files)
      .filter((file) => /^css\/[^/]+\.css$/.test(file))
      .toSorted(),
    "Update the complete stylesheet order when bundled libraries change"
  );

  // ===============================
  // SCRIPT AND STYLESHEET PACKAGING
  // ===============================
  /** @param {string[]} entries Ordered classic scripts. @param {Object} [sources=files] Input bytes, including the complete PHP error adapter. @returns {Buffer} Concatenated minified bytes with source/license boundaries and global exports intact. */
  function scripts(entries, sources = files) {
    return Buffer.from(
      entries
        .map((file) => {
          assert.ok(files[file], `Missing framework dependency: ${file}`);
          return `/*! ${config.repository}: ${file}; original licenses are retained in this file and LICENSE.md. */\n${sources[file].toString().replace(/\n?\/\/[#@] sourceMappingURL=.*$/gm, "")}\n;\n`;
        })
        .join("\n")
    );
  }

  /** @param {string[]} entries Ordered stylesheets. @param {boolean} embedded Embed fonts/images when true. @returns {Promise<Buffer>} Flattened CSS with embedded or package-relative asset URLs. */
  async function stylesheet(entries, embedded) {
    const result = await build({
      stdin: { contents: entries.map((file) => `@import ${JSON.stringify(`./${file}`)};`).join("\n"), resolveDir: root, loader: "css" },
      bundle: true,
      minify: true,
      write: false,
      legalComments: "inline",
      logLevel: "silent",
      loader: Object.fromEntries([".woff", ".woff2", ".ttf", ".eot", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp"].map((extension) => [extension, "dataurl"])),
      plugins: [
        {
          name: "release-owned-css",
          setup(builder) {
            builder.onResolve({ filter: /.*/ }, (args) => {
              if (/^(?:data:|#)/.test(args.path)) return { path: args.path, external: true };
              assert.ok(!/^(?:https?:)?\/\//.test(args.path), `Framework CSS needs an unbundled remote asset: ${args.path}`);
              const target = path.resolve(args.resolveDir || root, args.path);
              const relative = path.relative(root, target).split(path.sep).join("/");
              assert.ok(files[relative], `Missing packaged CSS asset: ${relative}`);
              if (!embedded && args.kind === "url-token") return { path: `./${relative}`, external: true };
              return { path: target };
            });
            builder.onLoad({ filter: /\.(?:css|woff2?|ttf|eot|svg|png|jpe?g|gif|webp)$/ }, (args) => {
              const relative = path.relative(root, args.path).split(path.sep).join("/");
              return {
                contents: files[relative],
                loader: relative.endsWith(".css") ? "css" : "dataurl",
                resolveDir: path.dirname(args.path)
              };
            });
          }
        }
      ]
    });
    return Buffer.from(result.outputFiles[0].contents);
  }

  const completeSources = { ...files };
  if (php) {
    const source = await fs.readFile(path.join(root, "_spa.js"), "utf8");
    const original = "const paths = [`${bySPA.HOME_PATH}/_error.php`, `${bySPA.HOME_PATH}/spa.php/_error.php`, `${bySPA.HOME_PATH}/../_error.php`];";
    assert.ok(source.includes(original), "Review the complete PHP error-path adapter after changing the framework");
    const adapted = source
      .replace(original, "const paths = [bySPA.ERROR_PATH, `${bySPA.HOME_PATH}/_error.php`, `${bySPA.HOME_PATH}/spa.php/_error.php`, `${bySPA.HOME_PATH}/../_error.php`].filter(Boolean);")
      .replace("`${path}?probe=1`", '`${path}${path.includes("?") ? "&" : "?"}probe=1`');
    completeSources["_spa.js"] = Buffer.from(
      (
        await transform(adapted, {
          loader: "js",
          minify: true,
          legalComments: "inline",
          charset: "utf8",
          target: "es2020"
        })
      ).code
    );
  }
  const bundleScript = scripts(core);
  const bundleStyle = await stylesheet(["_common.css"], false);
  const completeStyle = await stylesheet([...styles, "_common.css"], true);
  const cssLiteral = JSON.stringify(completeStyle.toString()).replaceAll("<", "\\u003c");
  const errorBootstrap = php
    ? '(() => { window.bySPA = window.bySPA || {}; const source = new URL(document.currentScript.src); if (source.searchParams.get("asset") === "spa.complete.js") { source.searchParams.set("asset", "_error.php"); window.bySPA.ERROR_PATH ||= source.href; } })();'
    : `window.bySPA = window.bySPA || {}; window.bySPA.ERROR_PATH ||= "data:text/html;charset=utf-8," + encodeURIComponent(${JSON.stringify(files["_error.html"].toString()).replaceAll("<", "\\u003c")}) + "#";`;
  const completeScript = Buffer.concat([
    Buffer.from(`/*! [EXPERIMENTAL] Complete reusable ${config.repository} framework; application bootstrap/routes load first. */\n`),
    scripts(libraries),
    Buffer.from(
      `\n;(() => {\n  const style = document.createElement("style");\n  style.dataset.source = "${config.repository} complete styles";\n  if (document.currentScript?.nonce) style.nonce = document.currentScript.nonce;\n  style.textContent = ${cssLiteral};\n  document.head.append(style);\n})();\n`
    ),
    Buffer.from(`\n;${errorBootstrap}\n`),
    scripts(core, completeSources)
  ]);
  const assets = [
    { file: "spa.bundle.js", body: bundleScript, description: "Core JS", format: "bundle-script" },
    { file: "spa.bundle.css", body: bundleStyle, description: "Core CSS", format: "bundle-style" },
    { file: "spa.complete.js", body: completeScript, description: "[EXPERIMENTAL] Complete browser framework", format: "complete-script" }
  ];

  // ==============
  // DEMO PACKAGING
  // ==============
  /**
   * Rewrite only the release demo's imports; the framework continues to use native bootstrap/navigation.
   * @param {string} source Authored demo file.
   * @param {boolean} complete Complete edition selection.
   * @param {string} file Demo path for PHP include-path resolution.
   * @returns {Promise<string>} Application file referencing the generated reusable framework.
   */
  async function demo(source, complete, file) {
    if (php && complete && file.endsWith(".php")) {
      const depth = path.posix.dirname(file).split("/").length;
      source = source.replace("<?php", `<?php\nrequire_once __DIR__ . ${JSON.stringify(`${"/..".repeat(depth)}/spa.complete.php`)};`);
      source = source.replace(/require_once "\{\$TO_HOME\}\/\.\.\/(_[a-z]+\.php)";/g, 'require_once byspa_framework_path() . "/$1";');
    }
    if (php) source = source.replace(/<\?=\s*"\{\$HOME_PATH\}\/\.\.\/([^"<>]+)"\s*\?>/g, "../$1");
    if (php && complete) source = source.replaceAll("../img/byuwur.png", "../spa.complete.php?asset=img/byuwur.png");
    const script = /<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/gi;
    const moved = [];
    source = source.replace(script, (tag, url) => {
      const normalized = php ? url.replace(/^<\?=\s*"\{\$HOME_PATH\}\/\.\.\//, "../").replace(/"\s*\?>$/, "") : url;
      if (core.some((name) => normalized.endsWith(`/${name}`))) return "";
      if (complete && libraries.some((name) => normalized.endsWith(`/${name}`))) return "";
      if (!php && /\.\/_init\.js$|\.\/_routes\.js$/.test(url)) {
        moved.push(tag);
        return "";
      }
      return tag;
    });
    source = source.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/gi, (tag) => {
      if (tag.includes("_common.css") || (complete && styles.some((name) => tag.includes(name)))) return "";
      return tag;
    });
    if ((!php && file === "demo/index.html") || (php && file === "demo/home.php")) {
      const framework = complete ? '<script src="../spa.complete.js" defer></script>' : '<link rel="stylesheet" href="../spa.bundle.css" />\n<script src="../spa.bundle.js" defer></script>';
      source = source.replace("</head>", `${moved.join("\n")}\n${framework}\n</head>`);
      if (complete) {
        // Live Google services stay application opt-ins instead of becoming framework dependencies.
        source = source.replace(/<script\b[^>]*src="https:\/\/(?:www\.google\.com|translate\.google\.com)[^"]*"[^>]*>\s*<\/script>/gi, "");
        source = source.replace(/(?:\.\.\/img\/byuwur\.png|<\?=\s*"\{\$HOME_PATH\}\/\.\.\/img\/byuwur\.png"\s*\?>)/g, `data:image/png;base64,${files["img/byuwur.png"].toString("base64")}`);
      }
    }
    if (complete && !php) source = source.replaceAll("../img/byuwur.png", `data:image/png;base64,${files["img/byuwur.png"].toString("base64")}`);
    if (file.endsWith(".html"))
      source = await format(source, {
        parser: "html",
        tabWidth: 2,
        trailingComma: "none",
        useTabs: false,
        proseWrap: "never",
        printWidth: 240,
        bracketSameLine: true,
        singleAttributePerLine: false,
        htmlWhitespaceSensitivity: "css",
        objectWrap: "preserve"
      });
    return source;
  }

  const bundled = { ...files, "spa.bundle.js": bundleScript, "spa.bundle.css": bundleStyle };
  for (const file of [...core, "_common.css", "_fonts.css", "_transitions.css"]) delete bundled[file];
  for (const file of Object.keys(bundled).filter((file) => /^demo\/.*\.(?:html|php)$/.test(file))) bundled[file] = Buffer.from(await demo(bundled[file].toString(), false, file));
  const complete = Object.fromEntries(Object.entries(files).filter(([file]) => file.startsWith("demo/") || ["README.md", "LICENSE.md"].includes(file)));
  for (const file of Object.keys(complete).filter((file) => /\.(?:html|php)$/.test(file))) complete[file] = Buffer.from(await demo(complete[file].toString(), true, file));
  complete["spa.complete.js"] = completeScript;
  if (php) {
    const archiveFiles = {
      ...Object.fromEntries(Object.entries(files).filter(([file]) => !file.startsWith("demo/"))),
      "spa.complete.js": completeScript
    };
    // Keep error pages and cURL's certificate bytes available inside the reusable PHP file.
    let functions = archiveFiles["_functions.php"].toString();
    functions = functions.replace('$error_file, "{$TO_HOME}/_error.php"', '$error_file, byspa_framework_path() . "/_error.php", "{$TO_HOME}/_error.php"');
    functions = functions.replace(/curl_setopt\(\$req, CURLOPT_CAINFO, \$cert_file\);/g, 'if (defined("CURLOPT_CAINFO_BLOB")) curl_setopt($req, CURLOPT_CAINFO_BLOB, file_get_contents(byspa_framework_path() . "/cacert.pem"));');
    archiveFiles["_functions.php"] = Buffer.from(functions);
    const archiveDirectory = await fs.mkdtemp(path.join(staging, ".php-"));
    try {
      for (const [file, bytes] of Object.entries(archiveFiles)) {
        const destination = path.join(archiveDirectory, file);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, bytes);
      }
      const archive = path.join(archiveDirectory, "framework.phar");
      execFileSync(process.env.PHP_BINARY || "php", ["-d", "phar.readonly=0", path.join(root, ".github/scripts/package-phar.php"), archiveDirectory, archive], { cwd: root, stdio: "pipe" });
      const body = await fs.readFile(archive);
      complete["spa.complete.php"] = body;
      delete complete["spa.complete.js"];
      // Serve the browser bundle from the same PHP file; the reusable framework remains one physical file.
      for (const file of Object.keys(complete).filter((file) => file.startsWith("demo/") && file.endsWith(".php")))
        complete[file] = Buffer.from(complete[file].toString().replaceAll("../spa.complete.js", "../spa.complete.php?asset=spa.complete.js"));
      assets.push({
        file: "spa.complete.php",
        body,
        description: "[EXPERIMENTAL] Complete PHP framework",
        format: "complete-php"
      });
    } finally {
      assert.equal(path.dirname(archiveDirectory), staging);
      await fs.rm(archiveDirectory, { recursive: true, force: true });
    }
  }
  return {
    assets,
    bundled,
    complete,
    inventory: {
      core,
      libraries,
      styles,
      application: "demo/",
      experimental: true,
      jqueryUIIcons: "https://code.jquery.com/ui/1.14.2/themes/base/images/",
      adapters: php ? ["Embedded PHP error endpoint", "Embedded error fallback", "Embedded cURL certificate bytes"] : ["Embedded static error document"]
    }
  };
}
