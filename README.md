# byuwur/spa.php

A small PHP framework for single-page applications. PHP handles routes; jQuery loads pages and shared components without a full refresh.

Try it at [byuwur.co/spa.php](https://byuwur.co/spa.php/). For static HTML pages, use [spa.js](https://github.com/byuwur/spa.js).

## What does it do?

- Routes PHP pages with GET and POST data.
- Loads shared components and reinitializes their UI after navigation.
- Provides request, storage, modal, validation, session, and error-page helpers.
- Works with Bootstrap and optional bundled integrations.

## Installation

You need PHP 8.1+, jQuery, and the core framework scripts. Bootstrap and other libraries are needed only for the features you use.

```bash
git clone https://github.com/byuwur/spa.php.git
```

Serve the checkout with PHP and open `demo/`. The repository's root entry points redirect there. For your own application, follow the layout below and adapt the Apache or Nginx rules to your mount path.

## Usage

1. Start with the demo shell and copy `_init.php` into your application's root.
2. Define your route table in the application's `_routes.php`.
3. Load initialization and routes before the framework router, as the demo does.
4. Add PHP pages and point routes and components at them.
5. Use `.env.example` for environment settings when your application needs them.

Keep application settings outside the framework directory. Each independently routed application needs its own initializer and route table.

### Migration [v14]

`_var.php` became `_init.php`. Rename the application's copy and update its includes. There is no compatibility alias.

## How is it done?

The **application root** owns the shell, initialization, routes, and configuration. The **framework root** holds reusable code, normally as a `spa.php/` submodule.

```text
application-root/
|-- home.php        # Application shell and route entry point
|-- _init.php       # Application initialization
|-- _routes.php     # Application route table
|-- .htaccess       # Apache routing; use equivalent Nginx rules
`-- spa.php/        # Framework checkout or submodule
```

These are required by the default setup. Copy `_init.php` into the application root: loading the framework copy directly derives paths from the wrong directory. Define `$routes` before including `_router.php`. Route non-file requests to `home.php?uri=...`; if you rename the shell, update the server rules too.

The demo uses its parent directory as the framework root. Regular consumers keep the full framework checkout at `spa.php/`, reachable by PHP includes and browser asset URLs.

### Framework files

| File                        | Purpose                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `_init.php`                 | Template for the application's initializer: paths, environment, storage, and runtime state. |
| `_functions.php`            | PHP request, API response, validation, escaping, error, and file helpers.                   |
| `_common.php`               | Default language, theme, and common request state.                                          |
| `_plugins.php`              | Optional application Composer autoloader.                                                   |
| `_config.php`               | Optional environment-based MySQL connection, with safe connection errors.                   |
| `_auth.php`                 | Optional sessions, login/logout, session checks, and CSRF helpers.                          |
| `_router.php`               | URI resolution, route data, direct file routes, and browser route state.                    |
| `_spa.js`                   | Navigation, history, page/component requests, and route lifecycle.                          |
| `_functions.js`             | Browser request, JSON, cookie, modal, and validation helpers.                               |
| `_common.js`, `_common.css` | Shared UI initialization and styles.                                                        |
| `_error.php`                | Server-side HTTP error page.                                                                |
| `css/`, `js/`, `img/`       | Bundled libraries and shared interface assets.                                              |
| `cacert.pem`                | Certificate bundle for outbound cURL HTTPS requests.                                        |
| `composer.json`             | Optional Composer dependencies.                                                             |

### Application and demo files

Application-specific `_common.php`, `_plugins.php`, `_config.php`, and `_auth.php` can extend the framework setup. Dictionaries go in `lang/`. `.env`, `vendor/`, and `composer.lock` belong to the application when it uses those dependencies.

`demo/` contains the runnable shell, routes, pages, sidebar, dictionaries, background, flags, sample PDF, and video. Shared images referenced by `_common.css` stay in the framework's `img/` directory.

Root `home.php` and `index.html` are redirects, not shells to copy. Root `.htaccess` handles that compatibility entry point; `nginx.conf` is an example for consumers. `.nojekyll` is for static GitHub Pages publishing, not PHP execution.

### Bundled libraries

Libraries are included in `css/` and `js/` and loaded from local paths. The intention is to avoid depending on CDNs or external resources for these assets. Load only the libraries your application uses.

- **Interface:** Bootstrap, Popper, jQuery, jQuery UI, and Shards UI.
- **Forms:** Select2, Pickr, and Dropzone.
- **Media:** Swiper and Video.js.
- **Animation:** Animate.css, Typed.js, particles.js, GSAP, and MorphSVGPlugin.
- **Consent:** Cookie Consent (`js/cookies.min.js`).
- **Icons and fonts:** Font Awesome with local webfonts, Archivo, Bahnschrift, and OpenDyslexic in `css/webfonts/`.

Keeping these files local gives you control over updates and availability. Update the bundled copies when needed; optional integrations that call external services still need those services.

## Runtime contracts

### Routes and navigation

- `bySPA.VERSION` identifies the framework; `bySPA.APP_VERSION` identifies your application.
- Route-defined GET/POST data overrides `/$/` path parameters, which override query parameters.
- Only the first `?` separates path and query. Later question marks stay in the value, including hash-query values read by `get_url_param()`.
- Component GET data replaces overlapping query keys; `uri=false` stays authoritative.
- Navigation emits `bySPA:before-unload`, then `bySPA:load` on success or `bySPA:error` on failure. The timeout is 30 seconds (`bySPA.REQUEST_TIMEOUT`).
- Unknown routes emit one error before loading the standalone error page. A failed error-page load adds no second terminal event. Error details are `{ navigationId, url, status, error }`; status `0` means no transport status.
- Superseded requests cannot update the newer page or emit a terminal event. Initial browser loading follows the same rules; initial requests rejected by PHP never begin a browser SPA lifecycle. FILE routes leave the document without a success event.

`HOME_PATH` resolves requests and history. Ordinary primary clicks on same-origin links are routed; the application prefix is removed for links inside it. Root-relative virtual links such as `/home` keep their route path, including unknown routes. Targets, downloads, hashes, and `custom-folder="true"` retain browser navigation. PHP uses path routing; `#/` links remain native. Smooth scrolling applies only to an existing same-document ID with the same origin, path, and query.

### Storage and shared UI

Storage keys use the finalized application root as a namespace. Legacy values are removed after successful migration. Consent reads theme and language through the same `byStorage` helper.

A failed write keeps that key's local value until a successful explicit write or removal. A failed removal keeps a local null marker. Other keys still read persistent storage. Removing a key also removes its legacy unprefixed copy. There is no automatic replay or cross-tab reconciliation; memory fallback lasts for the current runtime only.

`byCommon.init()` is quiet by default. Use `byCommon.INIT_WARNINGS = true` or `{ showWarn: true }` for optional sidebar, Bootstrap, captcha, consent, and particles diagnostics. Required-runtime errors still appear.

### Fragment scripts and error pages

Trusted page and component scripts execute as real script elements. Inline and non-async external scripts keep their order; `defer` fragments and non-async modules are awaited too. Explicit external `async` scripts run independently. Script attributes, including CSP/SRI and data attributes, are preserved.

External script failures are logged but do not stop later scripts or fail navigation. Superseded fragments stop processing. `bySPA:load` waits for the current page and components' ordered scripts.

Error pages replace the full document and use the same script rules. History navigation away reloads the application with a clean runtime.

## Security basics

Authorization belongs to your application. Keep role and tenant checks explicit at each endpoint; HTML fragments are trusted application content.

- `_auth.php` uses strict sessions and secure cookies on HTTPS. Login regenerates the session ID by default; call CSRF checks on state-changing endpoints.
- Supply a CSRF token in a meta tag or `sessionStorage`; `_functions.js` includes it in jQuery POST requests:

```php
<meta name="csrf-token" content="<?= htmlspecialchars(csrf_token(), ENT_QUOTES, "UTF-8") ?>" />
```

```js
sessionStorage.setItem("CSRF_TOKEN", token);
```

- `session_check()` validates the session without rewriting `$_GET` or `$_POST`. A form POST to an SPA route is forwarded once and never stored in history.
- `make_http_request()` attempts POST once and does not replay ambiguous failures with another protocol. Transport failure returns `false` or the existing decoded result; invalid URLs return `null`.
- Session IDs are forwarded only with `ALLOW_POST_SESSION_ID` enabled and a URL matching `APP_URL`. Leave it disabled unless a controlled same-application request needs it.
- Set `APP_URL` behind a proxy, or enable `TRUST_PROXY` with exact `TRUSTED_PROXIES` addresses. Other forwarded headers are ignored. Validate user-influenced outbound URLs to prevent SSRF.
- `build_sql_query()` rejects UPDATE/DELETE without a valid condition. Full-table changes require `allow_full_table => true`; relaxed validation does not grant that permission.
- Empty `NOT IN []` is not a restrictive condition. Relaxed mutations need another restrictive condition or full-table permission; strict mutations reject it even with either. Empty `IN []` matches nothing. Trusted SQL fragments are not checked for arbitrary tautologies.
- Keep the supplied denial of all `tests` path segments, including submodules. In Nginx it must precede the PHP handler and sit outside overriding `^~` locations. CLI tests also reject web execution.
- Track `composer.lock` in applications for reproducible installs.

For local HTTP diagnostics only:

```bash
php -S 127.0.0.1:8000 -t tests
```

This bypasses production rewrites on loopback. `get_and_post.php` and `test_pass.php` return plain text with `nosniff`; do not expose this server publicly.

`byCommon.accessibilityText("plus")` and `byCommon.accessibilityText("minus")` change body text size by `0.25rem`, within `0.5rem` to `3rem`. Calling it without a mode resets text to `1rem`.

## Maintaining a submodule integration

Framework changes belong here. Consumers pin a commit, so they must review and record their own submodule update separately.

1. Review the old and new framework commits.
2. Reconcile application-owned `_init.php` and `_routes.php`, preserving application settings. Updating the submodule does not update copied initialization.
3. Run the framework's [CI checks](.github/workflows/ci.yml).
4. Test affected behavior in the consuming application before recording its upgrade.

### Shared SPA maintenance

SPA.php and SPA.js share selected behavior, not entire runtime files. Neither automatically synchronizes the other.

| Files                        | Shared behavior / difference                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `_functions.js`              | Query parsing and request-listener behavior; comments and local names may differ.                                        |
| `_common.js`                 | Consent namespace and ordinary-click handling, with host settings preserved.                                             |
| `_spa.js`                    | Query, click, success/error, stale-navigation, and bounded error fallback rules; transport, history, and routing differ. |
| `_init.php` / `_init.js`     | Storage behavior and application-owned bootstrap copies.                                                                 |
| `_router.php` / `_router.js` | Host-specific; no source parity requirement.                                                                             |

Compare reviewed immutable commits and run the [shared contract checks](tests/SPA_PARITY.md). Record intentional differences and reconcile consumer initializers. Storage upgrades must preserve per-key fallback, failed-removal markers, legacy migration, live reads for unaffected keys, and recovery only through successful explicit changes.

## Related tools

- [easy-md-viewer](https://github.com/byuwur/easy-md-viewer): Readable, themed Markdown with rich formatting and zero dependencies.
- [easy-json-viewer](https://github.com/byuwur/easy-json-viewer): Explore large JSON documents with collapsible trees and responsive rendering.
- [easy-http-error](https://github.com/byuwur/easy-http-error): Friendly bilingual error pages that work even when PHP fails.
- [easy-sidebar-bootstrap](https://github.com/byuwur/easy-sidebar-bootstrap): Responsive Bootstrap navigation that remembers your sidebar preferences.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and [CODING_STANDARDS.md](CODING_STANDARDS.md) for engineering standards.

## License

MIT (c) Andrés Trujillo [Mateus] byUwUr
