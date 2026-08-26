# byuwur/spa.php

**byUwUr's Easy PHP SPA**

~ SPA made easy, with love, and PHP. ~

Test it out at: [byuwur.co/spa.php/](https://byuwur.co/spa.php/)

Looking for a static SPA micro-framework? Check out [byuwur/spa.js](https://github.com/byuwur/spa.js).

## What's this about?

This project is a simple, easy-to-use framework for building single-page applications (SPAs) using PHP. It provides a structure for handling routing, modals, and basic operations required for an SPA. The framework is designed to be lightweight and easy to integrate into existing projects.

**[NEW!]** Try use this repository as a git submodule: See how it's used at [github.com/byuwur/byuwur.github.io](https://github.com/byuwur/byuwur.github.io). Easier than a package, because sometimes you don't need a package.

## What does it do?

- **Client-Side Routing:** Use PHP to manage SPA routes, supporting both GET and POST methods.
- **Compatible:** Add everything you want on top of it. It's meant to be flexible for you.
- **Local Storage Management:** Automatically saves and retrieves necessary variables using the browser's local storage.
- **Bootstrap Integration:** Easily create modals with custom content, titles, and behaviors.
- **AJAX Support:** Built-in support for making AJAX requests to load content dynamically without full page reloads thanks to jQuery.
- **Custom Error Handling:** Set up custom error pages for various HTTP status codes.

## How is it done?

### What "SPA root" means

- The **application root** is the public directory that owns one independently routed SPA, such as the root of `byuwur.github.io` or this repository's `demo/` directory.
- The **framework root** is the `spa.php/` checkout or submodule consumed by that application. It normally lives at `application-root/spa.php/`; the repository demo uses the parent directory as the equivalent framework root. Reusable files stay there and are referenced from the application.

The old `(root)` and `(main)` labels mixed location with responsibility. The distinction used here is **application-owned** versus **framework-owned**, followed by whether the file is required by the default setup.

### REQUIRED at each application root

The default PHP SPA layout requires:

```text
application-root/
|-- home.php        # REQUIRED application shell and router entry point
|-- _init.php       # REQUIRED application-specific SPA initialization
|-- _routes.php     # REQUIRED application route table
|-- .htaccess       # REQUIRED on Apache; use equivalent server rules on nginx
`-- spa.php/        # REQUIRED framework checkout/submodule
```

- **home.php:** Sets `$setLocalStorage`, loads the application and framework files in order, renders the shell, and is the rewrite target for SPA routes. It may be renamed only when the server rules are updated with it.
- **\_init.php:** Copy this application-specific initialization file into each SPA root. Its filesystem and entry-point context establish `$SYSTEM_ROOT`, `$HOME_PATH`, `$TO_HOME`, environment values, browser storage, and related runtime state. Loading `spa.php/_init.php` directly would derive application paths from the framework directory instead of the consuming application.
- **\_routes.php:** Must define `$routes` before `spa.php/_router.php` is included. It can be stored elsewhere only if `home.php` explicitly loads that location first.
- **.htaccess or equivalent server configuration:** Must route non-file requests to `home.php?uri=...`. Apache uses an application-root `.htaccess`; nginx uses equivalent `try_files` configuration based on `spa.php/nginx.conf`.
- **spa.php/:** In a normal consumer, the framework directory must remain reachable by PHP includes and browser asset URLs at this application-root path. The repository demo references the parent directory instead because it already is the framework checkout. A normal Git submodule still checks out the full directory.

Framework files are reusable implementation; `_init.php` and `_routes.php` are application-owned copies/configuration. If a project has multiple independent SPA roots, each root needs its own `_init.php` and route table because initialization belongs to that entry-point context.

### Framework/Core files [in priority order]

- **\_init.php:** Provides the starting implementation to copy as the required application-owned `_init.php`; it initializes application and browser paths, environment values, namespaced storage, and runtime state before routes and the router load.
- **\_functions.php:** Provides shared PHP utilities for API responses, HTTP requests, validation, escaping, error handling, files, and other common work used by routes and application endpoints.
- **\_common.php:** Establishes the default common request state, including language and theme, before the application shell and route are rendered. The default shell uses it; an application can add its own `_common.php` after it.
- **\_plugins.php:** Optionally loads the consuming application's Composer autoloader so its libraries are available to SPA endpoints; application-specific plugin setup remains outside the framework.
- **\_config.php:** Optionally creates the environment-configured MySQL connection used by application endpoints and returns a safe API error if the connection fails.
- **\_auth.php:** Optionally supplies strict session setup plus login, logout, session-validation, and CSRF helpers for authenticated SPA endpoints.
- **\_router.php:** Resolves the incoming URI against the application's route table, merges route parameters, serves direct file routes, and passes the resulting route state to the browser.
- **\_spa.js:** Handles browser history, link interception, route requests, page/component replacement, and the lifecycle that runs after dynamically loaded content.
- **\_functions.js:** Provides browser-side request, JSON, cookie, modal, validation, and other reusable helpers for SPA pages and application scripts.
- **\_common.js:** Reinitializes shared sidebar, accessibility, Bootstrap, tooltip, and modal behavior after the initial page and each dynamic route load.
- **\_common.css:** Supplies the reusable loader, sidebar, accessibility, and base interface styles used by the application shell and dynamically loaded content.
- **\_error.php:** Renders the reusable server-side HTTP error page used when routing or an endpoint fails.
- **css/** and **js/**: Reusable vendor assets used by the demo and available to applications. `_spa.js` requires jQuery, while Bootstrap and the other libraries are required only by the helpers or UI an application enables.
- **img/**: Shared loader and interface assets referenced by framework styles.
- **cacert.pem:** Certificate bundle used by the `_functions.php` cURL helpers when the application makes outbound HTTPS requests.
- **composer.json:** Declares the optional Composer dependencies that an application may load through `_plugins.php`.

### Application-owned optional files

- **\_common.php:** Application-specific common variables, dictionaries, or initialization layered after the framework preset.
- **\_plugins.php:** Application-specific Composer library initialization layered after the framework autoloader helper.
- **\_config.php:** Application-specific database or service connections when the framework's MySQL helper is not sufficient.
- **\_auth.php:** Application authorization rules layered around the optional framework session helpers.
- **lang/**: Application dictionaries when the SPA renders translated PHP fragments. The repository demo supplies `demo/lang/`.
- **.env**, **vendor/**, and **composer.lock:** Required only when the application loads environment files or Composer dependencies; they belong to the consuming application rather than the submodule.

### Repository compatibility files

- **home.php:** Redirects requests made to the deployed repository root into `demo/`; it is not the application shell consumers should copy.
- **index.html:** Provides the same static fallback redirect when PHP `DirectoryIndex` handling is unavailable.
- **.htaccess:** Routes repository-root requests through the compatibility entry point and retains the repository's security and error directives. Consumer applications need their own application-root routing rules.
- **nginx.conf:** Shows the equivalent nginx route fallback that a consuming application can adapt in its server configuration.
- **.env.example:** Documents optional environment values consumed by database, authentication, request, and development behavior; the actual environment belongs to the application.
- **.nojekyll:** Keeps static files unchanged when the repository is published through GitHub Pages; it is not part of the PHP runtime.

### Demo

The runnable showcase is fully contained in `demo/`: its application initialization, shell, routes, page fragments, sidebar, dictionaries, background, flags, sample PDF, and sample video. It owns `$SYSTEM_ROOT` and `$HOME_PATH` like a real consumer and loads reusable framework files from the parent directory, which takes the place a submodule folder would have in another repository. Visiting `https://byuwur.co/spa.php/` redirects to it.

The root `img/icon-back.png`, `img/icon-fore.png`, and `img/byuwur.png` remain beside `_common.css` because shared CSS references them.

## Installation

1. Clone the repository to your local machine.
2. Ensure your web server has PHP installed.
3. Update `.htaccess` or `nginx.conf` to match your server mount path.

## Runtime contracts

`spa.php` is a hybrid SPA micro-framework. PHP 8.1+, jQuery, and the core framework scripts are hard runtime dependencies; Bootstrap and other bundled integrations are optional unless used by the application.

`bySPA.VERSION` is the framework/runtime version and can be read with `console.log(bySPA.VERSION)`. `bySPA.APP_VERSION` remains the consuming application's version.

Route data precedence is fixed: route-defined `GET`/`POST` values override `/$/` path parameters, which override ordinary query parameters. Route state is namespaced from the finalized application root and falls back to memory when browser storage is unavailable; successfully migrated legacy values are removed so they cannot reappear later.

Navigation emits `bySPA:before-unload`, then `bySPA:load` on success or `bySPA:error` on failure. Older slow responses are ignored. `bySPA.REQUEST_TIMEOUT` defaults to 30 seconds.

`byCommon` initialization is quiet by default. Set `byCommon.INIT_WARNINGS = true` to enable optional sidebar, Bootstrap, captcha, cookie-consent, and particles diagnostics, or pass `{ showWarn: true }` for one call. Required-runtime errors and warnings outside that initialization chain remain visible.

Scripts in trusted route and component fragments execute as real browser `<script>` elements. Inline scripts and non-`async` external scripts keep source order; `defer` external scripts are treated as ordered fragment dependencies because dynamic fragments have no document-parser defer phase. Non-`async` module scripts are also awaited. Explicit external `async` scripts start independently and do not delay later fragment scripts or `bySPA:load`. Attributes, including CSP/SRI and data attributes, are preserved. External load failures are logged but do not fail navigation or stop later scripts; stale navigation stops the old fragment before it can continue. `bySPA:load` fires only after the current route and component fragments finish processing their ordered scripts.

Error pages intentionally replace the full document rather than rendering inside the SPA shell. Their scripts use the same ordered execution rules; history navigation away triggers a full reload so the application starts with a clean runtime.

Set `APP_URL` to the public application URL behind a proxy. Alternatively enable `TRUST_PROXY` and list exact proxy addresses in `TRUSTED_PROXIES`; forwarded headers from other clients are ignored.

Login regenerates the session ID by default. Applications remain responsible for authorization and for calling CSRF checks on state-changing endpoints. Validate or allowlist user-influenced outbound URLs to prevent SSRF. HTML fragments are trusted application HTML.

`build_sql_query()` rejects `UPDATE` and `DELETE` when no valid condition is built. Intentional full-table mutations require the explicit `allow_full_table => true` option; relaxed validation does not grant destructive scope.

## Usage

1. Copy `_init.php` into the application root and keep that application-specific initialization there.
2. Define your application's routes in its own `_routes.php`.
3. Use the routing system to manage your SPA's navigation.
4. Add custom functionality by creating new PHP files and adding them to the routes.
5. Configure environment variables in `.env` using `.env.example` when the application needs them.
6. Navigate. Suit yourself.

### Migration [v14]

`_var.php` was renamed to `_init.php`. Existing applications must rename their copied file and update every include from `_var.php` to `_init.php`; no compatibility alias is provided.

## Security basics

- `_auth.php` enables strict sessions, secure cookies on HTTPS, and CSRF helpers.
- Add the CSRF token to a meta tag or `sessionStorage` and `_functions.js` will include it in jQuery POST requests:

```php
<meta name="csrf-token" content="<?= htmlspecialchars(csrf_token(), ENT_QUOTES, "UTF-8") ?>" />
```

```js
sessionStorage.setItem("CSRF_TOKEN", token);
```

- `make_http_request()` does not forward the PHP session ID unless `ALLOW_POST_SESSION_ID` is explicitly enabled and the URL matches `APP_URL`. Keep it disabled unless a controlled same-application request truly needs the same session.
- `session_check()` validates the session; it does not rewrite `$_GET` or `$_POST`. Application tenant scope stays explicit.
- A form POST sent to an SPA route is forwarded once to the routed PHP file and is not stored in browser history.
- Public, authenticated, role, and tenant authorization belong to the consuming application. Keep those rules explicit at the endpoint.
- Track `composer.lock` in applications so dependency installs are reproducible.

## Some other things I've made and used here

- [easy-http-error](https://github.com/byuwur/easy-http-error) - Custom error page with server configurations.
- [easy-sidebar-bootstrap](https://github.com/byuwur/easy-sidebar-bootstrap) - Sidebar component using Bootstrap and jQuery.

## License

MIT (c) Andrés Trujillo [Mateus] byUwUr
