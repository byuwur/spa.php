const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const SPA_JS_REVISION = "8a3df8aca9e92b5dcfa32f495f9ce005ccbbfb69";
const reference = process.env.SPA_JS_TREE;

function source(file) {
  if (!reference) return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const tree = path.resolve(reference).replace(/\\/g, "/");
  // Read the reviewed objects, never the checkout's moving HEAD or working files.
  return execFileSync("git", ["-c", `safe.directory=${tree}`, "-C", tree, "show", `${SPA_JS_REVISION}:${file}`], { encoding: "utf8" });
}

module.exports = { source, reference };
