# byuwur/spa.php

![SPA.php demo preview](prev.jpg)

A PHP single-page application framework with server-side routing, jQuery page/component loading, shared UI, and request/session helpers.

<!-- [Demo](https://byuwur.co/spa.php/) · [Static HTML version: SPA.js](https://github.com/byuwur/spa.js) -->

[Demo](https://spa.byuwur.co/) · [Static HTML version: SPA.js](https://github.com/byuwur/spa.js)

## Installation

Requires PHP 8.1+ and jQuery. Optional features need their bundled libraries.

```bash
git clone https://github.com/byuwur/spa.php.git
```

Serve the checkout with PHP and open `demo/`; the root entry points redirect there.

## How is it done?

Keep the application shell, configuration, pages, components, and dictionaries outside the framework submodule:

```text
application-root/
|-- home.php        # Shell and route entry point
|-- _init.php       # Application initializer
|-- _routes.php     # Route table
|-- .htaccess       # Rewrite rules, or equivalent Nginx configuration
`-- spa.php/        # Framework
```

1. Copy the demo shell and framework `_init.php` into your application. Each SPA needs its own initializer and routes.
2. Load `_init.php` and `_routes.php` (which defines `$routes`) before `_router.php`; map routes/components to PHP pages.
3. Route non-file requests to `home.php?uri=...`. Update server rules if you rename the shell.

Copy the framework initializer into your application; loading the template directly derives the wrong application paths. The demo uses its parent as the framework root. Keep application `.env`, Composer files, and configuration outside the framework; use `.env.example` when needed.

| Files                                      | Purpose                                              |
| ------------------------------------------ | ---------------------------------------------------- |
| `_init.php`, `_router.php`                 | Bootstrap, route resolution, and browser state.      |
| `_spa.js`                                  | AJAX navigation, history, components, and lifecycle. |
| `_functions.php`, `_functions.js`          | Server/browser utilities and request helpers.        |
| `_common.php`, `_common.js`, `_common.css` | Defaults, shared UI, and styles.                     |
| `_load.js`                                 | Native ordered CSS/JavaScript dependency loading.    |
| `_transitions.css`, `_transitions.js`      | Shared page motion and opt-in content updates.       |
| `_fonts.css`                               | Bundled fonts; imported by `_common.css`.            |
| `_fonts.js`                                | Optional Google Fonts loading and pickers.           |
| `_auth.php`, `_config.php`, `_plugins.php` | Optional sessions/CSRF, MySQL, and Composer setup.   |
| `_error.php`                               | Standalone HTTP error page.                          |
| `css/`, `js/`, `img/`, `cacert.pem`        | Bundled libraries, assets, and cURL certificates.    |

Application `_common.php`, `_auth.php`, `_config.php`, and `_plugins.php` can extend framework setup. Load only needed libraries. Remote integrations need their services; shared CSS images live in the framework's `img/`.

Since v14, `_var.php` is `_init.php`; update old includes. No compatibility alias exists.

## Runtime contracts

### Routes and navigation

- Fragments use POST and path history. Route GET/POST values override `/$/` parameters, which override queries. Component GET values override URI queries; `uri=false` remains authoritative.
- Only the first `?` separates path/query; later question marks remain in values. `get_url_param()` also reads hash queries.
- Navigation emits `bySPA:before-unload`, then one `bySPA:load` or `bySPA:error`. Error details are `{ navigationId, url, status, error }`; status `0` means no transport status. `bySPA.REQUEST_TIMEOUT` defaults to 30 seconds.
- Superseded work stops, including when lifecycle listeners start another navigation. Unknown routes report one error; failed error-page loading adds none. FILE routes leave without a load event; initial routes rejected by PHP never begin a browser lifecycle.
- `HOME_PATH` resolves requests/history. Ordinary same-origin clicks route, including root-relative virtual paths. Modified/middle clicks, targets, downloads, hashes, and `custom-folder="true"` stay native. Smooth scrolling requires an existing ID in the same document, origin, path, and query.
- `bySPA.VERSION` identifies the framework; `bySPA.APP_VERSION` identifies the application.

### Storage and shared UI

Each API has one `initialized` flag. Bootstrap may populate its namespace before `_spa.js` sets `bySPA.initialized = true`. Reimports preserve active navigation and storage fallbacks; `byCommon.init()` still initializes new content.

`byStorage` namespaces keys by application root and removes legacy keys after migration. Failed writes/removals give that key a local value/null marker until an explicit change succeeds; other keys still read persistent storage. Removal also clears legacy copies. Fallback lasts only for this runtime, without automatic replay or cross-tab synchronization.

`_spa.js` calls `byCommon.init()` after content changes; standalone pages must call it explicitly. Warnings default off: enable `byCommon.INIT_WARNINGS` or pass `{ showWarn: true }`. Public `byCommon.initSelect2Keyboard()` enables only Select2 keyboard behavior. `byCommon.initBootstrap({ tooltipsOnly: true, root, refreshTooltips: true })` refreshes scoped tooltips without other components.

Modal cleanup disposes optional font controls and removes the captured element, preserving replacements with the same ID. `byCommon.accessibilityText(mode)` uses `"plus"`/`"minus"` to change root size in `0.25rem` steps within `0.5rem`-`3rem`; no argument resets `1rem`.

After `byCommon.init()`, Up/Down in an open single-select Select2 commits the highlighted value, emits input/change and selection events, and keeps the dropdown open. Hover only highlights; multi-selects require confirmation. Dynamic controls and remote results work likewise; `select2:selecting` can cancel a change.

Data, HTML-text escaping, CSRF utilities, and WebSocket transport are native. UI, HTTP/form helpers, and WebSocket DOM logging use jQuery; modals also need Bootstrap.

### Compressed URL data

`compress_url_data(text)` and `decompress_url_data(token, maxBytes = 1048576)` return native Promises and use raw DEFLATE with unpadded Base64url, without jQuery or SPA initialization.

```js
const token = await compress_url_data(JSON.stringify(settings));
const restored = JSON.parse(await decompress_url_data(token));
```

Requires native `CompressionStream`/`DecompressionStream` support for `deflate-raw`. Decompression rejects malformed data/UTF-8 and output above the positive safe-integer UTF-8 byte limit. Callers own JSON, validation, URL parameters, and format markers.

### Ordered assets

`_load.js` provides native `byLoad(files, { host, before, defer })` without jQuery. CSS and classic JavaScript load in array order; await completion before app initialization. Default `defer: true` waits for DOM parsing; `defer: false` starts immediately, even in the head. Dynamic scripts do not delay `DOMContentLoaded`.

```html
<script src="https://cdn.jsdelivr.net/gh/byuwur/spa.js@v20.12/_load.min.js"></script>
<script>
  const SPA_VERSION = "v20.12";
  const HOST = `https://cdn.jsdelivr.net/gh/byuwur/spa.js@${SPA_VERSION}`;
  (async () => {
    await byLoad(
      [
        { path: "/css/bootstrap.min.css", optional: false },
        { path: "/_transitions.min.css", optional: false }
      ],
      { host: HOST, defer: false }
    );
    await byLoad(
      [
        { path: "/js/jquery.min.js", optional: false },
        { path: "/_functions.min.js", optional: false },
        { path: "/_transitions.min.js", optional: false }
      ],
      { host: HOST }
    );
    // Initialize the application here.
  })().catch(console.error);
</script>
```

For early CSS, load the bootstrap script without `defer` and start stylesheets with `defer: false`. The JavaScript batch waits for CSS and DOM parsing.

Leading `/` paths use `host`; `./` and `../` stay document-relative, including `file://`. Absolute URLs and embedded CSS/JS data URLs work too. `before` places stylesheets relative to an existing head element. Entries accept `{ path, attributes }`; `{ path, optional: true }` warns and returns `null` on failure (for example, optional icon fonts). Required failures reject and stop the batch. Duplicate URLs share a request; failed URLs can be retried. Reimports retain the registry, and existing page event handlers are preserved.

### Page transitions

`_common.css` imports `_transitions.css` and `_fonts.css`; transitions can also load without the common theme or resets. Set `--transition-duration` on the root/container to override `0.3s`. Shared rules are defaults; resources own their overrides. Tooltips, popovers, and their contents have no animations/transitions by default. The reduced-motion block is commented out for each resource to enable or override its duration; `no-motion` still disables shared motion.

Load `_transitions.js` for native container height/opacity animations, without jQuery or Promise wrappers:

```js
byTransition(
  "#results",
  (element) => {
    element.replaceChildren(...results);
  },
  { duration: 200, children: false }
);

const watcher = byTransition.watch("#notifications", { children: true, exclude: ".preview" });
// Existing code can now update the container normally.
watcher.disconnect(); // Before removing or replacing the watched container.
```

`byTransition()` accepts a selector for current containers or an element, runs updates synchronously once per match (even with motion off), and returns its native animations. `watch()` coalesces child/text mutations and owns animations when the helper updates the same container. Default `children: false` animates only the selected container and watches direct content; `children: true` also animates direct children and watches descendants. The update callback still runs once per container. Resource-owned `exclude` selectors omit matching elements and descendants from animation and observation. Watchers do not observe attributes, discover later containers, or replace nodes. Disconnect before attaching another watcher to the same container. `duration` is non-negative milliseconds; omitted timing uses `--transition-duration`, with `ease` easing.

### Optional Google Fonts

`_fonts.js` loads fonts natively with caching and offline fallbacks. Pickers also need jQuery, Select2, `_common.css`, and `data-font-picker` controls:

```html
<script src="./spa.php/_fonts.js" defer></script>
<input name="fontFamily" data-font-picker value="Inter" />
```

`byFont.family(value, fallback)` returns a CSS stack; `await byFont.ready(value, weight, text)` waits before measurement. Use `byFont.init(container)` / `byFont.destroy(container)` for dynamic fields, or `byFont.picker(field, { weight, previewText, fallback })` for one control. `weight` can be a control.

`byCommon.init()` enhances marked fields; navigation/modal cleanup disposes them. Reinitialization preserves widgets; missing optional libraries leave ordinary controls usable. Applications own font values and persistence.

### Fragment scripts and error pages

Fragments are trusted application HTML. Ordered external/inline scripts, `defer`, and modules retain source order and attributes; explicit external `async` scripts run independently. Failures log and continue; stale fragments stop. `bySPA:load` waits for ordered page/component scripts. Sequencing uses `async`/`await`; public requests retain jQuery promises.

Error pages replace the document; Back reloads a clean runtime, even while error-page scripts load.

## Security basics

Applications own authorization and must sanitize untrusted HTML. `_auth.php` uses strict sessions and regenerates login session IDs; require CSRF checks on state-changing endpoints. Browser request helpers prefer a meta token, then `sessionStorage.CSRF_TOKEN`:

```php
<meta name="csrf-token" content="<?= htmlspecialchars(csrf_token(), ENT_QUOTES, "UTF-8") ?>" />
```

- `session_check()` preserves GET/POST. Initial form POST data is forwarded once, never stored in history. PHP `make_http_request()` does not retry ambiguous POST failures.
- Session-ID forwarding requires `ALLOW_POST_SESSION_ID` and a URL matching `APP_URL`. Behind proxies, set `APP_URL` or configure exact `TRUSTED_PROXIES` with `TRUST_PROXY`; validate outbound URLs.
- SQL UPDATE/DELETE needs a restrictive condition or explicit `allow_full_table => true`. Empty `NOT IN []` is not restrictive and strict mode rejects it. Trusted SQL fragments are not checked for tautologies.
- Block every `__tests__` path segment, including submodules; retain denial for `tests` in older pinned submodules. Nginx denial must precede PHP handling and sit outside overriding `^~` locations. Test scripts are CLI-only.
- Track application `composer.lock` for reproducible installs.

## Maintaining a submodule integration

Keep `_load.js`, `_transitions.css`, `_transitions.js`, `_fonts.css`, `_fonts.js`, `_functions.js`, `_common.js`, and `_common.css` identical across both SPAs; SPA.php owns the shared source. `_spa.js`, routing, transport, history, and application bootstrap retain host-specific behavior.

For upgrades, review changes, reconcile application-owned `_init.php`/`_routes.php` without losing settings, and run framework/consumer checks. Submodule updates do not update copied initializers; neither repository synchronizes the other automatically.

### Checks

Routine CI keeps small runtime/storage/navigation, safe-helper, ordered-loading, font-fallback, and lifecycle checks. Detailed widget, style, option, and catalog tests have been removed. New tests must protect a core contract or a real regression; host UI checks stay smaller than the distributed runtime checks.

```sh
node --test __tests__/common.test.js __tests__/fragment_scripts.test.js __tests__/routing.test.js __tests__/storage.test.js __tests__/fonts.test.js
node --test __tests__/browser.test.js __tests__/load.browser.test.js __tests__/transitions.browser.test.js
```

Install Playwright outside the repository and set `NODE_PATH` to its `node_modules`. `PLAYWRIGHT_CHANNEL=chrome` and `BROWSER_CHANNEL=chrome` select installed Chrome for the respective existing suites. CI uses a matching browser image instead of installing operating-system/browser packages in every job. Chromium, Firefox, and WebKit have separate jobs linked in that order. The small browser cases have 30-second limits, test steps two minutes, and jobs three minutes; superseded runs are canceled. A failed pass remains visible and does not hide the later engine results. `BROWSER_ENGINE` selects an engine locally.

Reviewed cross-project parity is the only optional suite; run `node --test __tests__/parity.test.js` or enable **extended** in [CI](.github/workflows/ci.yml). SQL, authentication, proxy, HTTP, API-response, tracked-source lint, and Composer validation remain routine gates; see CI for their commands.

`SPA_JS_TREE` selects a Git object store; [parity-source.js](__tests__/parity-source.js) pins the reviewed revision, ignoring its working tree and HEAD.

## Related tools

[easy-md-viewer](https://github.com/byuwur/easy-md-viewer) · [easy-json-viewer](https://github.com/byuwur/easy-json-viewer) · [easy-http-error](https://github.com/byuwur/easy-http-error) · [easy-sidebar-bootstrap](https://github.com/byuwur/easy-sidebar-bootstrap)

## Contributing

Follow [CODING_STANDARDS.md](CODING_STANDARDS.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE.md) · Copyright (c) Andrés Trujillo [Mateus] byUwUr

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/byuwur/spa.php)
