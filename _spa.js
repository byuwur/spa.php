"use strict";
/*
 * File: _spa.js
 * Desc: Manages the Single Page Application (SPA) functionality, including routing, state management, and AJAX loading of content.
 * Deps: jQuery, _functions.js
 * Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr
 */

/**
 * Initializes global object and assigns its properties.
 * This IIFE (Immediately Invoked Function Expression) ensures bySPA object exists globally
 * (typically on `window` in a browser) to avoid pollution and conflicts in the global namespace.
 * @param {Object} global - The global object, usually `window` in a browser.
 */
(function (global) {
  global.bySPA = global.bySPA || {};
  const bySPA = global.bySPA;
  bySPA.VERSION = "16";
  // Initializes values retrieved from localStorage and sets up environment variables.
  bySPA.URI = byStorage.getItem("URI") ?? "/";
  bySPA.URL = byStorage.getItem("URL") ?? bySPA.URI;
  bySPA._GET = parse_json(byStorage.getItem("_GET")) ?? {};
  bySPA._POST = parse_json(byStorage.getItem("_POST")) ?? {};
  bySPA.HISTORY_INDEX = -1;
  bySPA.APP_ENV = byStorage.getItem("APP_ENV") ?? "PROD";
  bySPA.APP_VERSION = byStorage.getItem("APP_VERSION") ?? "0.1by";
  bySPA.ROUTES = parse_json(byStorage.getItem("ROUTES")) ?? {};
  bySPA.TO_HOME = byStorage.getItem("TO_HOME");
  bySPA.HOME_PATH = byStorage.getItem("HOME_PATH");
  bySPA.HISTORY_PATH = [];
  // Monotonic route ownership prevents older asynchronous work from mutating a newer route.
  bySPA.NAVIGATION_ID = 0;
  // Applications may override this before requests are started.
  bySPA.REQUEST_TIMEOUT = bySPA.REQUEST_TIMEOUT || 30000;
  // These properties can be previously initialized to be overriden
  byCommon.GLOBAL_TRANSITION_DURATION = byCommon.GLOBAL_TRANSITION_DURATION || 199;

  /**
   * Builds a fragment request URL while preserving query parameters already present in the route URI.
   * @param {string} path Route fragment path, optionally containing a query string.
   * @param {Object} [get={}] Additional GET values. These replace matching URI query values.
   * @return {string} Absolute request URL, safe for nested deployments.
   */
  bySPA.buildRequestURL = function (path, get = {}) {
    const base = `${String(bySPA.HOME_PATH || window.location.origin).replace(/\/$/, "")}/`;
    const target = new URL(String(path || "/null").replace(/^\/+/, ""), base);
    Object.entries(get).forEach(function ([key, value]) {
      if (value !== undefined && value !== null) target.searchParams.set(key, value);
    });
    return target.href;
  };

  /**
   * Replaces one fragment and executes its scripts in source order. Ordered external scripts
   * and modules are awaited, script failures are non-fatal, and stale navigation stops the work.
   * @param {Element} target Element whose contents will be replaced.
   * @param {string} html Trusted application fragment HTML.
   * @param {number} navigationId Navigation generation that owns the fragment.
   * @param {boolean} replaceDocument Whether to intentionally replace the full document.
   * @return {Promise<string|null>} Inserted HTML, or null when navigation ownership was lost.
   */
  async function setHTML(target, html, navigationId, replaceDocument = false) {
    if (navigationId !== bySPA.NAVIGATION_ID) return null;
    let root;
    if (replaceDocument) {
      target.innerHTML = html;
      root = target;
    } else {
      const template = document.createElement("template");
      template.innerHTML = html;
      root = template.content;
    }
    const scripts = [...root.querySelectorAll("script")].map(function (script) {
      const placeholder = document.createComment("bySPA script");
      script.replaceWith(placeholder);
      return { script, placeholder };
    });
    if (!replaceDocument) target.replaceChildren(root);

    for (const item of scripts) {
      // Script failure -> continue. Stale navigation -> stop.
      if (navigationId !== bySPA.NAVIGATION_ID || !item.placeholder.isConnected) return null;
      const script = document.createElement("script");
      for (const attr of item.script.attributes) script.setAttribute(attr.name, attr.value);
      script.textContent = item.script.textContent;
      const hasSource = item.script.hasAttribute("src");
      const isModule = (item.script.getAttribute("type") || "").trim().toLowerCase() === "module";
      const waitForScript = hasSource || isModule;
      let settled;

      if (waitForScript)
        settled = new Promise(function (resolve) {
          const finish = function (failed) {
            script.removeEventListener("load", loaded);
            script.removeEventListener("error", failedToLoad);
            if (failed && hasSource && navigationId === bySPA.NAVIGATION_ID) console.error(`SPA fragment script failed to load: ${script.src || item.script.getAttribute("src")}`);
            resolve();
          };
          const loaded = function () {
            finish(false);
          };
          const failedToLoad = function () {
            finish(true);
          };
          script.addEventListener("load", loaded, { once: true });
          script.addEventListener("error", failedToLoad, { once: true });
        });

      item.placeholder.replaceWith(script);
      // Explicit async external scripts keep independent browser timing and do not delay lifecycle completion.
      if (waitForScript && !(hasSource && item.script.hasAttribute("async"))) {
        await settled;
        if (navigationId !== bySPA.NAVIGATION_ID) return null;
      }
    }
    return html;
  }

  /**
   * Updates local route variables in memory.
   * @param {object} state The current route state.
   */
  function setRouteState(state = {}) {
    bySPA.URI = state.path ?? bySPA.URI;
    bySPA.URL = state.url ?? bySPA.URL;
    bySPA._GET = state.get ?? bySPA._GET ?? {};
    bySPA._POST = state.post ?? bySPA._POST ?? {};
    return state;
  }

  /**
   * Pushes the current state to the browser's history stack.
   * @param {string} url The URL to push to the history stack.
   */
  function historyPush(url) {
    bySPA.HISTORY_PATH = bySPA.HISTORY_PATH.slice(0, bySPA.HISTORY_INDEX + 1);
    bySPA.HISTORY_INDEX++;
    bySPA.HISTORY_PATH[bySPA.HISTORY_INDEX] = url;
    history.pushState({ index: bySPA.HISTORY_INDEX, url }, "", `${bySPA.HOME_PATH}${url}`);
  }

  /**
   * Replaces the current history state without creating a new entry.
   * @param {string} url The URL to store in the current history entry.
   */
  function historyReplace(url) {
    if (bySPA.HISTORY_INDEX < 0) bySPA.HISTORY_INDEX = 0;
    bySPA.HISTORY_PATH[bySPA.HISTORY_INDEX] = url;
    history.replaceState({ index: bySPA.HISTORY_INDEX, url }, "", `${bySPA.HOME_PATH}${url}`);
  }

  /**
   * Displays a standalone error page by intentionally replacing the full document.
   * Ordered scripts finish before temporary SPA error state is discarded.
   * @param {number} status HTTP status code.
   * @param {string} custom_error_message A custom error message to display.
   * @param {number} navigationId Navigation generation that owns the error.
   * @return {Promise<string|null>} Error-fragment request result.
   */
  bySPA.errorPage = function (status, custom_error_message = "", navigationId = bySPA.NAVIGATION_ID) {
    const paths = [`${bySPA.HOME_PATH}/_error.php`, `${bySPA.HOME_PATH}/spa.php/_error.php`, `${bySPA.HOME_PATH}/../_error.php`];
    const render = async function (data) {
      // A late error must not replace content belonging to a newer route.
      if (navigationId !== bySPA.NAVIGATION_ID) return null;
      // Temporarily expose bySPA variables to the error page
      bySPA.ERROR_STATUS = status;
      bySPA.ERROR_MESSAGE = custom_error_message;

      // Full-document replacement is intentional; only the ordered script runner is shared with fragments.
      const inserted = await setHTML(document.documentElement, data, navigationId, true);
      window.addEventListener(
        "popstate",
        function () {
          window.location.reload();
        },
        { once: true }
      );
      delete bySPA.ERROR_STATUS;
      delete bySPA.ERROR_MESSAGE;
      return inserted;
    };
    const requestError = function (path) {
      return $.ajax({
        url: `${path}?e=${status}`,
        type: "POST",
        data: { custom_error_message },
        dataType: "text",
        timeout: bySPA.REQUEST_TIMEOUT
      })
        .then(render)
        .catch(function (xhr, ajaxStatus, error) {
          if (navigationId !== bySPA.NAVIGATION_ID) return null;
          if (xhr?.responseText) return render(xhr.responseText);
          console.error(`Error (errorPage): ${xhr?.status} ${ajaxStatus} ${error}`, bySPA.APP_ENV == "DEV" ? xhr : "");
          return null;
        });
    };
    const loadError = function (paths, index = 0) {
      return requestError(paths[index]).then(function (data) {
        if (data !== null || index + 1 >= paths.length) return data;
        return loadError(paths, index + 1);
      });
    };
    return loadError(paths);
  };

  /**
   * Validates if the querySelector input is valid for use
   * @param {string} selector The querySelector string to validate.
   * @return {boolean} Validity of the selector input
   */
  function validateQuerySelector(selector) {
    try {
      document.querySelector(selector);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Parses a querySelector and creates a corresponding jQuery element.
   * @param {string} selector The querySelector string to parse. It supports tag name, ID, classes and attr.
   * @return {jQuery} The created jQuery element based on the provided selector string.
   */
  function parseQuerySelector(selector) {
    if (!validateQuerySelector(selector)) return false;
    const tag = selector.match(/^[a-z]+/i);
    const id = selector.match(/#[a-zA-Z0-9-_]+/);
    const classes = selector.match(/\.[a-zA-Z0-9-_]+/g);
    const attr = [...selector.matchAll(/\[([a-zA-Z0-9-_]+)='([^']*)'\]/g)];

    const _tag = tag ? tag[0] : "div";
    const $el = $(`<${_tag}>`);

    if (id) $el.attr("id", id[0].slice(1));
    if (classes) $el.addClass(classes.map((cls) => cls.slice(1)).join(" "));
    attr.forEach((a) => $el.attr(a[1], a[2]));
    return $el;
  }

  /**
   * Validates the ID of a querySelector to check in a element with that ID exists
   * @param {string} selector The querySelector string to validate.
   * @return {boolean} Whether the component ID exists
   */
  function componentIdExists(selector) {
    const id = selector.match(/#[a-zA-Z0-9-_]+/);
    if (!id) {
      console.warn(`Insert a valid ID to search if a component exists...`);
      return false;
    }
    return $(id[0]).length;
  }

  /**
   * Reloads a specific component to its elementID via an AJAX request.
   * @param {string} component The selector for the component to reload.
   * @param {string} file The file path to load the content from.
   * @param {object} get The GET parameters to pass.
   * @param {object} post The POST parameters to pass.
   * @param {number} navigationId Navigation generation that owns the component request.
   * @return {Promise<string|null>|jQuery|undefined} Component request or immediate clear/validation result.
   */
  bySPA.reloadComponent = function (component, file, get, post, navigationId = bySPA.NAVIGATION_ID) {
    if (!component.includes("#")) return console.warn(`Can't use Component: ID${bySPA.APP_ENV === "DEV" ? " " + component : ""} isn't valid`);
    if (!validateQuerySelector(component)) return console.warn(`Can't use Component: ${bySPA.APP_ENV === "DEV" ? component : ""} isn't valid`);
    if (!componentIdExists(component)) {
      console.warn(`Component ${bySPA.APP_ENV === "DEV" ? "(" + component + ")" : " "} missing. Creating and appending to the body...`);
      if ($("#spa-content").length) $(parseQuerySelector(component)).insertBefore("#spa-content");
      else $("body").append(parseQuerySelector(component));
    }
    // If there's a component, extract the ID
    const componentId = component.match(/#[a-zA-Z0-9-_]+/)[0];
    // If no file is provided, clear the component's content
    if (!file || file == "null") return $(componentId).html("");
    return $.ajax({
      url: `${bySPA.HOME_PATH}${file}?${new URLSearchParams({ ...get, uri: false }).toString()}`,
      type: "POST",
      data: { ...post },
      dataType: "text",
      timeout: bySPA.REQUEST_TIMEOUT
    })
      .then(function (data) {
        // Ignore a slow component after the user has moved to another route.
        if (navigationId !== bySPA.NAVIGATION_ID) return null;
        return setHTML(document.querySelector(componentId), data, navigationId);
      })
      .catch(function (xhr, status, error) {
        if (navigationId !== bySPA.NAVIGATION_ID) return null;
        console.warn(`Error (component): ${xhr?.status} ${status} ${error}`, bySPA.APP_ENV == "DEV" ? xhr : "");
        $(componentId).html("");
        return null;
      });
  };

  /**
   * Parses the given URI into a path and associated parameters.
   * @param {string} uri The URI to parse.
   * @return {object} An object containing the path and parameters.
   */
  bySPA.parseURL = function (uri = "/") {
    uri = String(uri || "/").trim();
    if (uri.includes("://")) {
      try {
        const parsed = new URL(uri);
        uri = parsed.pathname + parsed.search;
      } catch (e) {
        uri = "/";
      }
    }
    uri = uri.split("#", 1)[0] || "/";
    const [pathInput, queryInput = ""] = uri.split("?", 2);
    // Ensure the URI starts with a "/" and doesn't end with one
    let pathUri = pathInput || "/";
    if (!pathUri.startsWith("/")) pathUri = `/${pathUri.replace(/^\/+/, "")}`;
    while (pathUri.length > 1 && pathUri.endsWith("/")) pathUri = pathUri.substring(0, pathUri.length - 1);
    const query = Object.fromEntries(new URLSearchParams(queryInput));
    const url = `${pathUri}${queryInput ? `?${queryInput}` : ""}`;
    // Handle URI parameters if present
    if (!pathUri.includes("/$/")) return { path: pathUri, params: {}, query, url };
    const [path, param] = pathUri.split("/$/", 2);
    const keyValuePairs = param.split("/");
    const params = {};
    // Iterate over the parameters and store them as key-value pairs
    for (let i = 0; i < keyValuePairs.length; i += 2)
      if (keyValuePairs[i + 1] !== undefined) {
        try {
          params[decodeURIComponent(keyValuePairs[i])] = decodeURIComponent(keyValuePairs[i + 1]);
        } catch (e) {
          params[keyValuePairs[i]] = keyValuePairs[i + 1];
        }
      }
    return { path, params, query, url };
  };

  /**
   * Routes the given URI within the SPA, managing state and navigation.
   * Route GET values override /$/ parameters, which override ordinary query values.
   * @param {string} uri The URI to route.
   * @return {object} An object containing the routed path, URI, file, parameters, and components.
   */
  function routeURL(uri = "/") {
    // Parse the URI into path and parameters
    const { path, params, query, url } = bySPA.parseURL(uri);
    // Check if the path exists in the defined routes
    if (!Object.keys(bySPA.ROUTES).includes(path)) return null;
    const route = bySPA.ROUTES[path] ?? {};
    // Application configuration is authoritative: route > /$/ params > query.
    const get = { ...query, ...params, ...(route?.GET ?? {}) };
    const post = { ...(route?.POST ?? {}) };
    // Determine the final URI based on the route
    uri = route?.URI;
    // Determine the correct URI if it's not explicitly set
    if (uri == "") {
      get.uri = bySPA.URI || "/";
      uri = bySPA.ROUTES[get.uri]?.URI ? bySPA.ROUTES[get.uri]?.URI : bySPA.ROUTES["/"]?.URI;
    } else get.uri = path;
    setRouteState({ path, url, get, post });
    return { path, url, uri, file: route?.FILE, get, post, component: route?.COMPONENT };
  }

  /**
   * Loads the SPA content for the given URL, optionally pushing the state to history.
   * @param {string} url The URL to load.
   * Each call owns a new navigation generation; older page, component, error, loader, and lifecycle results are prevented from mutating the current route.
   * Emits bySPA:before-unload, followed by bySPA:load or bySPA:error.
   * @param {object} mode History handling options (`push`, `replace`, and optional `post`).
   * @return {Promise<string|null>|void} Page request, error request, or direct file navigation.
   */
  bySPA.load = function (url, mode = { push: true }) {
    const navigationId = ++bySPA.NAVIGATION_ID;
    const historyMode = typeof mode === "object" ? mode : {};
    document.dispatchEvent(new CustomEvent("bySPA:before-unload", { detail: { navigationId, url } }));
    // Log debug information if in development mode
    if (bySPA.APP_ENV === "DEV") console.log(`loadSPA("${url}", ${parse_json(mode)})`);
    $("#spa-loader").fadeIn(1);
    const routing = routeURL(`${url}`);
    if (historyMode.push) historyPush(`${url}`);
    if (historyMode.replace) historyReplace(`${url}`);
    // If routing fails, return early
    if (!routing)
      return bySPA.errorPage(404, `Route "${url}" does not exist.`).always(function () {
        $("#spa-loader").fadeOut(byCommon.GLOBAL_TRANSITION_DURATION);
      });
    $("#spa-content").html("");
    const { path, uri, file, get, post: routePost, component } = routing;
    const post = { ...routePost, ...(historyMode.post ?? {}) };
    if (bySPA.APP_ENV === "DEV") console.log("routeURL(): PATH=", path, "; URI=", uri, "; FILE=", file, "; _GET=", get, "; _POST=", post, "; COMPONENT=", component);
    // If a file is specified in the route, navigate to it directly
    if (file) return (window.location = `${bySPA.HOME_PATH}${path}`);
    // If the SPA container is missing, create the element
    if (!$("#spa-content").length) {
      // Checks for reloadComponent to continue, if not: reload completely
      if (!bySPA.reloadComponent) return window.location.reload();
      console.warn("Main Component (main#spa-content) missing. Creating and appending to the body...");
      $("body").append(
        $("<main>", {
          id: "spa-content"
        })
      );
    }
    // Reload each component associated with the route
    const componentLoads = [];
    for (let key in component || {}) componentLoads.push(bySPA.reloadComponent(key, component[key], get, post, navigationId));
    // Retrieve the page data
    return $.ajax({
      url: bySPA.buildRequestURL(uri ?? "/null", get),
      type: "POST",
      data: { ...post },
      dataType: "text",
      timeout: bySPA.REQUEST_TIMEOUT
    })
      .then(function (data) {
        // Correctness does not depend on aborting XHR: stale responses simply lose ownership of all DOM and lifecycle side effects.
        if (navigationId !== bySPA.NAVIGATION_ID) return null;
        return setHTML(document.querySelector("#spa-content"), data, navigationId).then(function (inserted) {
          if (inserted === null) return null;
          return Promise.allSettled(componentLoads.map((load) => Promise.resolve(load))).then(function () {
            if (navigationId === bySPA.NAVIGATION_ID) afterLoad({ ...routing, navigationId });
            return data;
          });
        });
      })
      .catch(function (xhr, status, error) {
        if (navigationId !== bySPA.NAVIGATION_ID) return null;
        console.error(`Error (SPA): ${xhr?.status} ${status} ${error}`, bySPA.APP_ENV == "DEV" ? xhr : "");
        document.dispatchEvent(new CustomEvent("bySPA:error", { detail: { navigationId, url, status: xhr?.status || 0, error } }));
        $("#spa-content").html(xhr?.responseText || `<pre>Error ${xhr?.status || 0}</pre>`);
        return null;
      })
      .always(function () {
        if (navigationId === bySPA.NAVIGATION_ID) $("#spa-loader").fadeOut(byCommon.GLOBAL_TRANSITION_DURATION);
      });
  };

  /**
   * Runs page/component lifecycle hooks after dynamic content is swapped.
   * @param {object} routing The loaded route data, including its navigationId.
   */
  function afterLoad(routing) {
    if (typeof byCommon !== "undefined" && typeof byCommon.init === "function") byCommon.init();
    document.dispatchEvent(new CustomEvent("bySPA:load", { detail: routing }));
  }

  function init() {
    if (typeof jQuery === "undefined" && !window.jQuery) return console.error("Init _spa.js FAILED. No jQuery found.");
    // Log debug information if in development mode
    console.log("SPA_VERSION=", bySPA.VERSION);
    console.log("APP_VERSION=", bySPA.APP_VERSION);
    if (bySPA.APP_ENV === "DEV") {
      console.log("TO_HOME=", bySPA.TO_HOME);
      console.log("HOME_PATH=", bySPA.HOME_PATH);
      console.log("URI=", bySPA.URI);
      console.log("URL=", bySPA.URL);
      console.log("ROUTES=", bySPA.ROUTES);
      console.log("_GET=", bySPA._GET);
      console.log("_POST=", bySPA._POST);
      console.log("HISTORY_INDEX=", bySPA.HISTORY_INDEX);
      console.log("HISTORY_PATH=", bySPA.HISTORY_PATH);
    }
    // Handles the popstate event for navigating through browser history.
    window.addEventListener("popstate", function (e) {
      if (!e.state) return;
      bySPA.HISTORY_INDEX = e.state.index;
      bySPA.load(e.state.url ?? bySPA.HISTORY_PATH[bySPA.HISTORY_INDEX], { push: false });
      if (bySPA.APP_ENV === "DEV") console.log("HISTORY_INDEX=", bySPA.HISTORY_INDEX, "; HISTORY_PATH=", bySPA.HISTORY_PATH);
    });
    // Attaches click event handlers to links for SPA navigation.
    $(document).on("click", "a[href]", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (this.target === "_blank" || this.hasAttribute("download") || this.getAttribute("custom-folder") == "true") return;
      const href = this.getAttribute("href");
      if (!href || href.startsWith("javascript:")) return;
      if (href.startsWith("#") && !href.startsWith("#/")) return;
      let nextURL = href;
      try {
        const absolute = new URL(this.href);
        if (absolute.origin != window.location.origin) return;
        const home = new URL(`${bySPA.HOME_PATH.replace(/\/$/, "")}/`, document.baseURI);
        const insideHome = absolute.pathname === home.pathname.replace(/\/$/, "") || absolute.pathname.startsWith(home.pathname);
        const candidate = bySPA.parseURL(`${absolute.pathname}${absolute.search}`).path;
        // Preserve normal navigation to sibling applications. Root-relative virtual routes remain routable when they are explicitly configured.
        if (!insideHome && !Object.prototype.hasOwnProperty.call(bySPA.ROUTES, candidate)) return;
        nextURL = bySPA.HOME_PATH && absolute.href.startsWith(bySPA.HOME_PATH) ? absolute.href.slice(bySPA.HOME_PATH.length) || "/" : `${absolute.pathname}${absolute.search}`;
      } catch (error) {
        return;
      }
      e.preventDefault();
      bySPA.load(nextURL);
    });
    // Initial load of SPA content based on the stored URL.
    bySPA.load(`${bySPA.URL}`, { replace: true, post: bySPA._POST });
  }

  init();
})(typeof window !== "undefined" ? window : this);
