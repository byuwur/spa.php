# Shared SPA contract checks

Comparison baseline: spa.php `e899d4fec55e8a596120118f4d83344983f3d368` and spa.js `6b37270c852cd9393e645227df122523548ecd11`. These are review references, not dependency upgrades. The README classifies responsibilities; no source-byte equality is asserted. The previous spa.js baseline, `8a3df8aca9e92b5dcfa32f495f9ce005ccbbfb69`, predates F8 and F10b.

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

- A. Intentional mirrors: `_functions.js` and `_common.js`; query parsing, request-listener ownership, consent namespacing, and ordinary-click ownership pass the reference vectors.
- B. Shared behavioral contracts with host-specific implementations: `_spa.js` and storage in `_init.php` / `_init.js`; F8 passes against the recorded spa.js object. F10b browser verification remains locally unverified because Playwright is unavailable.
- C. Host-specific: `_router.php` / `_router.js`, PHP/static transport, history, route modes, error handoff, and bootstrap configuration; no source-byte parity is required.
- D. Copied-initializer responsibility: application-owned `_init.php` / `_init.js` copies must be reviewed separately when the framework or parity baseline changes.
- PHP uses POST fragments, path history and PHP error candidates. Static SPA uses GET fragments, hash/path modes and an optional `ERROR_PATH` before HTML fallback candidates. Bounded fallback and success-only load events are shared requirements, not equal request URLs or source text.
- Static SPA accepts `#/` routing, explicit `_self` targets, and configured route paths outside its mount. PHP preserves native handling for hashes/any target and limits interception to `HOME_PATH`. The click fixture explicitly exercises the allowed hash and target differences; mount/route configuration remains host-owned. Both preserve external/unowned sibling navigation and modified/download/named-target clicks.
- PHP can reject an initial route server-side before a browser lifecycle starts. Static bootstrap has its own route-error handoff. PHP's full-document error/Back recovery test is host-specific.
- stream.fgc F16 remains a separate consumer follow-up: review its actual pinned framework revision, reconcile its copied `_init.js` storage/bootstrap behavior, preserve application configuration, and run its integration tests before recording an upgrade. No consumer repository was modified here.

Passing these selected vectors does not establish full runtime equivalence or automatically reconcile application copies.

## Baseline validation

The local Node suite passed 18 tests, including query suffixes, request ownership, consent, routing, fragment scripts, storage, and parity vectors. Against spa.js `6b37270c852cd9393e645227df122523548ecd11`, the reference helper and storage suite passed all 3 tests, including F8. The reference browser suite was attempted but could not start because the local environment has no Playwright module; F10b is therefore locally unverified, not a pass or an accepted alternative. PHP SQL tests passed 386 assertions; proxy, HTTP, and API response checks passed; JavaScript syntax checks and Composer validation passed. Checked PHP entrypoints passed lint. `git diff --check` passed. Xdebug log-path warnings were environmental and non-fatal. The CI browser environment (downloaded Chromium) was not executed locally; no new dependency was installed. Consumer integration tests and the static repository's full host-specific suite were not run.
