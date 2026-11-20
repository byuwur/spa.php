# byuwur/spa.php

A PHP single-page application framework with server-side routing, jQuery page/component loading, shared UI, and request/session helpers.

![SPA.php demo preview](prev.jpg)

## Index

1. [Quick start](#quick-start)
2. [Try it](#try-it)
3. [Downloads](#downloads)
4. [Application layout](#application-layout)
5. [Navigation](#navigation)
6. [Runtime helpers](#runtime-helpers)
7. [Security basics](#security-basics)
8. [Maintenance](#maintenance)
9. [Related projects](#related-projects)
10. [License](#license)

## Quick start

Requires PHP 8.1+ and jQuery. Optional features need their bundled libraries.

```bash
git clone https://github.com/byuwur/spa.php.git
```

Serve the checkout with PHP and open `demo/`; the root entry points redirect there.

The [demo](demo/) is a working application. Copy its shell, initializer and route table into your own application.

## Try it

[Demo](https://spa.byuwur.co/) · [Local demo](demo/)

## Downloads

[Regular ZIP](https://github.com/byuwur/spa.php/releases/latest/download/spa.php.zip) · [Minified ZIP](https://github.com/byuwur/spa.php/releases/latest/download/spa.php.minified.zip) · [Bundled ZIP](https://github.com/byuwur/spa.php/releases/latest/download/spa.php.bundled.zip) · [Complete ZIP [EXPERIMENTAL]](https://github.com/byuwur/spa.php/releases/latest/download/spa.php.complete.zip). Filenames stay the same across releases; `manifest.json` records the version and source commit.

| Edition                     | Contents                                            |
| --------------------------- | --------------------------------------------------- |
| Regular ZIP                 | Authored framework and `demo/`.                     |
| Minified ZIP                | Minified authored JS/CSS and `demo/`.               |
| Bundled ZIP                 | Core JS/CSS bundles and `demo/`.                    |
| Complete ZIP [EXPERIMENTAL] | One reusable framework file and a separate `demo/`. |

Bundled builds need jQuery, optional UI dependencies, and the accompanying asset folders. Complete builds embed shipped libraries, CSS, fonts and framework error handling. The application still owns its pages, routes, dictionaries, credentials and external services.

### Complete PHP framework [EXPERIMENTAL]

`spa.complete.php` is the reusable framework; the application remains in `demo/`. It is an uncompressed native [PHP PHAR](https://www.php.net/manual/en/phar.php) with a PHP entry point, preserving framework include paths and assets without extracting files. Requires PHP 8.1+ with Phar. `phar.readonly=0` is used only by the build subprocess; the generated file runs with read-only archives enabled.

```php
require_once __DIR__ . "/../spa.complete.php";
$setLocalStorage = true;
require_once __DIR__ . "/_init.php";
require_once byspa_framework_path() . "/_functions.php";
require_once byspa_framework_path() . "/_common.php";
require_once __DIR__ . "/_routes.php";
require_once byspa_framework_path() . "/_router.php";
```

```html
<script src="../spa.complete.php?asset=spa.complete.js" defer></script>
```

The PHP endpoint serves allowlisted public assets. Phar is required at runtime; writable archives are needed only during packaging. Older cURL integrations use their configured system trust store.

## Application layout

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

The demo uses its parent as the framework root. Keep application `.env`, Composer files, and configuration outside the framework; use `.env.example` when needed.

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

## Navigation

- Fragments use POST and path history. Route GET/POST values override `/$/` parameters, which override queries. Component GET values override URI queries; `uri=false` remains authoritative.
- Only the first `?` separates path/query; later question marks remain in values. `get_url_param()` also reads hash queries.
- Navigation emits `bySPA:before-unload`, then one `bySPA:load` or `bySPA:error`. Error details are `{ navigationId, url, status, error }`; status `0` means no transport status. `bySPA.REQUEST_TIMEOUT` defaults to 30 seconds.
- Superseded work stops, including when lifecycle listeners start another navigation. Unknown routes report one error; failed error-page loading adds none. FILE routes leave without a load event; initial routes rejected by PHP never begin a browser lifecycle.
- `HOME_PATH` resolves requests/history. Ordinary same-origin clicks route, including root-relative virtual paths. Modified/middle clicks, targets, downloads, hashes, and `custom-folder="true"` stay native. Smooth scrolling requires an existing ID in the same document, origin, path, and query.
- `bySPA.VERSION` identifies the framework; `bySPA.APP_VERSION` identifies the application.

Fragments are trusted application HTML. Ordered external/inline scripts, `defer`, and modules retain source order and attributes; explicit external `async` scripts run independently. Failures log and continue; stale fragments stop. `bySPA:load` waits for ordered page/component scripts. Sequencing uses `async`/`await`; public requests retain jQuery promises.

Error pages replace the document; Back reloads a clean runtime, even while error-page scripts load.

## Runtime helpers

1. [Storage and shared UI](#storage-and-shared-ui)
2. [Compressed URL data](#compressed-url-data)
3. [Ordered assets](#ordered-assets)
4. [Page transitions](#page-transitions)
5. [Optional Google Fonts](#optional-google-fonts)

### Storage and shared UI

`byStorage` scopes keys to the application root and migrates legacy keys. A failed write or removal falls back in memory for that key until an explicit change succeeds. Consent defaults to dark mode and Spanish. Reimporting helpers preserves storage and active navigation.

Navigation calls `byCommon.init()` for new content. Call it yourself on standalone pages. Use `byCommon.INIT_WARNINGS` or `{ showWarn: true }` for diagnostics. `initSelect2Keyboard()` enables keyboard selection; `initBootstrap({ tooltipsOnly: true, root, refreshTooltips: true })` refreshes scoped tooltips. Single-select arrows commit the highlighted item and keep the list open; multi-selects require confirmation. Modal cleanup disposes controls owned by the closing element.

Load `_privacy.js` in the website shell. After the body is ready, call `const controls = byCommon.initPrivacyControls({ policyURL, cookiesURL, message, onChoice })`. The host applies `"yes"` or `"no"` in `onChoice` and calls `controls.update(true, savedChoice)` to reflect its stored preference. Call `controls.update(false)` on excluded routes. Omitting `onChoice` previews the UI in the current tab. Close dismisses the banner for 180 days without changing consent. Use `data-privacy-inline="on-load"` on a page fragment to show the banner once per visit even with a saved choice. Accept, Reject and Close dismiss it for that visit. The banner follows the host theme or system appearance. A fixed-theme host can pass an explicit `theme` of `light` or `dark`. By default dismissal is stored on the origin. Hosts can pass `dismissalDomain` to share dismissal through a secure first-party domain cookie. Open the banner with `byCommon.openPrivacyControls()`, `<a href="#privacy-controls">Privacy settings</a>`, or `<button type="button" data-target="#cookie-controls">Cookie settings</button>`. Both fragments also work in direct links.

`byCommon.accessibilityText("plus" | "minus")` changes the root font in 0.25rem steps from 0.5rem to 3rem. Call it without arguments to reset to 1rem. Data, escaping, CSRF and WebSocket transport run natively. UI and form helpers use jQuery, and modals need Bootstrap.

Place `<div data-privacy-inline></div>` on the privacy page to display the same controls in the page flow, including the current choice. Other pages show the compact cookie banner until the visitor chooses or dismisses it. Link to the privacy page or `#cookie-controls` from your site's navigation so visitors can change their choice later.

### Compressed URL data

`compress_url_data(text)` and `decompress_url_data(token, maxBytes = 1048576)` return native Promises and use raw DEFLATE with unpadded Base64url, without jQuery or SPA initialization.

```js
const token = await compress_url_data(JSON.stringify(settings));
const restored = JSON.parse(await decompress_url_data(token));
```

Requires native `CompressionStream`/`DecompressionStream` support for `deflate-raw`. Decompression rejects malformed data/UTF-8 and output above the positive safe-integer UTF-8 byte limit. Callers own JSON, validation, URL parameters, and format markers.

### Ordered assets

Load [\_load.js](_load.js) before calling `byLoad()`. It loads CSS and classic scripts in array order. Await required assets before initializing the app.

```html
<script src="https://cdn.jsdelivr.net/gh/byuwur/spa.js@v20.14/_load.min.js"></script>
<script>
  const host = "https://cdn.jsdelivr.net/gh/byuwur/spa.js@v20.14";
  byLoad(["/css/bootstrap.min.css", "/js/jquery.min.js"], { host, defer: false }).catch(console.error);
</script>
```

`defer` defaults to true and waits for DOM parsing. Use false for early CSS. A leading slash uses `host`; relative paths resolve against the document. Absolute and data URLs also work. Use `before` to position styles, and `{ path, attributes, optional }` for individual files. Optional failures resolve to `null`; required failures reject. Duplicate URLs share their request, and failed loads can be retried.

### Page transitions

`_common.css` imports the font and transition stylesheets. Override `--transition-duration` (default 0.3s) or use `no-motion`. [\_transitions.js](_transitions.js) supplies `byTransition(target, update, options)` and `byTransition.watch(target, options)`. Updates run once per matched container even with motion disabled. `children` includes direct children and observes descendants; `exclude` omits matching subtrees. Disconnect watchers before replacing their container.

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

### Optional Google Fonts

[\_fonts.js](_fonts.js) caches fonts and falls back offline. Use `byFont.family(value, fallback)` for the CSS stack and await `byFont.ready(value, weight, text)` before measuring. For pickers, load jQuery, Select2 and `_common.css`, then mark fields with `data-font-picker`. `byFont.init(container)` and `byFont.destroy(container)` manage dynamic fields; `byFont.picker(field, options)` targets one field. The host owns persistence.

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

## Maintenance

Keep `_load.js`, `_transitions.css`, `_transitions.js`, `_fonts.css`, `_fonts.js`, `_functions.js`, `_common.js`, and `_common.css` identical across both SPAs; SPA.php owns the shared source. `_spa.js`, routing, transport, history, and application bootstrap retain host-specific behavior.

For upgrades, review changes, reconcile application-owned `_init.php`/`_routes.php` without losing settings, and run framework/consumer checks. Submodule updates do not update copied initializers; neither repository synchronizes the other automatically.

### Checks

```sh
node --test __tests__/common.test.js __tests__/fragment_scripts.test.js __tests__/routing.test.js __tests__/storage.test.js __tests__/fonts.test.js
node --test __tests__/browser.test.js __tests__/load.browser.test.js __tests__/transitions.browser.test.js
```

Set `NODE_PATH` to your installed Playwright modules. [CI](.github/workflows/ci.yml) runs Chromium automatically. Select **extended** for Firefox, WebKit and cross-project parity. PHP lint, Composer, SQL, authentication, proxy and HTTP/API checks also run.

### Local preview

Use Node.js 22+ and PHP 8.1+ with Phar. From the repository root:

```sh
npm --prefix .github ci --ignore-scripts --no-audit --no-fund
node .github/scripts/build.mjs --tag v0.0.0-local
node .github/node_modules/playwright/cli.js install chromium
npm --prefix .github run release:test
```

Review `dist/RELEASE_NOTES.md` and `dist/assets/`. Use `--offline` for local minification. The [release workflow](.github/workflows/release.yml) checks the archives and publishes on a version tag. The manifest records sources and hashes.

## Related projects

[Static HTML version: SPA.js](https://github.com/byuwur/spa.js) · [MD.view](https://github.com/byuwur/md.view) · [JSON.view](https://github.com/byuwur/json.view) · [easy-http-error](https://github.com/byuwur/easy-http-error) · [easy-sidebar-bootstrap](https://github.com/byuwur/easy-sidebar-bootstrap)

Follow [CODING_STANDARDS.md](CODING_STANDARDS.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE.md) · Copyright (c) Andrés Trujillo [Mateus] byUwUr
