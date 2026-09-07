# Shared SPA contract checks

Comparison baseline: spa.php `e899d4fec55e8a596120118f4d83344983f3d368` and spa.js `8a3df8aca9e92b5dcfa32f495f9ce005ccbbfb69`. These are review references, not dependency upgrades. The README classifies responsibilities; no source-byte equality is asserted.

The existing browser and storage suites are also executable against the recorded spa.js Git objects. `SPA_JS_TREE` supplies a local Git object store only: its branch, HEAD and uncommitted files are ignored. There is no fetch, clone, or external checkout requirement in CI. The local default tests remain the spa.php authority.

From spa.php, with PHP on PATH (or `PHP_BINARY` set), and the existing CI Playwright installation available through `NODE_PATH`:

```sh
node --test tests/parity.test.js tests/storage.test.js
node --test tests/browser.test.js
SPA_JS_TREE=/absolute/path/to/spa.js node --test tests/parity.test.js tests/storage.test.js
SPA_JS_TREE=/absolute/path/to/spa.js node --test --test-name-pattern='shared:' tests/browser.test.js
```

In PowerShell set `$env:SPA_JS_TREE = 'C:/path/to/spa.js'` before the two reference commands and remove it afterward with `Remove-Item Env:SPA_JS_TREE`. `BROWSER_CHANNEL` may select an installed Playwright-supported browser. Changing the comparison revision requires reviewing and updating `SPA_JS_REVISION` in `parity-source.js` and this record together.

The same vectors exercise complete query suffixes, real jQuery request ownership, namespaced consent, per-key storage failure/recovery/migration, ordinary-click ownership and navigation terminal events. A deliberately broken helper must fail the mirror vector. Storage runs both PHP-emitted root/demo copies locally and the actual static initializer against the reference. Browser fixtures supply host-specific bootstrap/transport configuration; they do not replace runtime decisions. PHP server routing, static initial router parsing and consumer integration remain covered by their respective repository/application suites, not this cross-runtime harness.

## Recorded differences and follow-up

- The approved spa.js baseline lacks F8: successful disk reads can override failed local writes, and failed removal lacks a tombstone. Its storage check is expected to fail, not be skipped or treated as parity success.
- It also lacks F10b's terminal error for unknown routes. The shared navigation check is expected to fail. Both gaps require a separately reviewed spa.js revision and a new comparison; this maintenance change does not repair spa.js.
- PHP uses POST fragments, path history and PHP error candidates. Static SPA uses GET fragments, hash/path modes and an optional `ERROR_PATH` before HTML fallback candidates. Bounded fallback and success-only load events are shared requirements, not equal request URLs or source text.
- Static SPA accepts `#/` routing, explicit `_self` targets, and configured route paths outside its mount. PHP preserves native handling for hashes/any target and limits interception to `HOME_PATH`. The click fixture explicitly exercises the allowed hash and target differences; mount/route configuration remains host-owned. Both preserve external/unowned sibling navigation and modified/download/named-target clicks.
- PHP can reject an initial route server-side before a browser lifecycle starts. Static bootstrap has its own route-error handoff. PHP's full-document error/Back recovery test is host-specific.
- stream.fgc F16 remains a separate consumer follow-up: review its actual pinned framework revision, reconcile its copied `_init.js` storage/bootstrap behavior, preserve application configuration, and run its integration tests before recording an upgrade. No consumer repository was modified here.

Passing these selected vectors does not establish full runtime equivalence or automatically reconcile application copies.

## Baseline validation

The local suite passed 18 Node tests and 12 browser tests (including navigation subtests). Against the recorded spa.js objects, both helper tests passed; storage failed at the first failed-write authority assertion (`disk` instead of `local`), so later storage assertions were not reached. Shared browser checks passed query, request ownership, consent, click policy, success, transport failure, bounded fallback and stale navigation. Both unknown-route cases lacked `bySPA:error` (two failed subtests and their parent). These are recorded failures, not accepted alternative contracts.

Local validation used PHP 8.4.15 and installed Edge through Playwright. All 41 PHP files passed lint; the SQL (386 assertions), proxy, auth, HTTP and API response checks passed, as did JavaScript syntax checks, Composer validation and `git diff --check`. Auth used a writable temporary session directory. PHP's Xdebug log-path warnings did not fail these checks. Linux CI's PHP 8.1 / downloaded Chromium environment was not executed locally; no new dependency was installed. Consumer integration tests and the static repository's full host-specific suite were not run by this closure pass.
