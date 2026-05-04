"use strict";
/*
 * File: _spa.js
 * Desc: Manages the Single Page Application (SPA) functionality, including routing, state management, and AJAX loading of content.
 * Deps: jQuery, _functions.js
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
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
	// Initializes values retrieved from localStorage and sets up environment variables.
	bySPA.URI = localStorage.getItem("URI") ?? "/";
	bySPA.URL = localStorage.getItem("URL") ?? bySPA.URI;
	bySPA._GET = parse_json(localStorage.getItem("_GET")) ?? {};
	bySPA._POST = parse_json(localStorage.getItem("_POST")) ?? {};
	bySPA.HISTORY_INDEX = -1;
	bySPA.APP_ENV = localStorage.getItem("APP_ENV") ?? "PROD";
	bySPA.APP_VERSION = localStorage.getItem("APP_VERSION") ?? "0.1by";
	bySPA.ROUTES = parse_json(localStorage.getItem("ROUTES")) ?? {};
	bySPA.TO_HOME = localStorage.getItem("TO_HOME");
	bySPA.HOME_PATH = localStorage.getItem("HOME_PATH");
	bySPA.HISTORY_PATH = [];

	/**
	 * Updates local route variables in memory.
	 * @param {object} state The current route state.
	 */
	bySPA.setRouteState = function (state = {}) {
		bySPA.URI = state.path ?? bySPA.URI;
		bySPA.URL = state.url ?? bySPA.URL;
		bySPA._GET = state.get ?? bySPA._GET ?? {};
		bySPA._POST = state.post ?? bySPA._POST ?? {};
		return state;
	};

	// Backward-compatible alias for code that used the old method name.
	bySPA.getLocalStorageItems = function () {
		return bySPA.setRouteState();
	};

	/**
	 * Pushes the current state to the browser's history stack.
	 * @param {string} url The URL to push to the history stack.
	 */
	bySPA.historyPush = function (url) {
		bySPA.HISTORY_PATH = bySPA.HISTORY_PATH.slice(0, bySPA.HISTORY_INDEX + 1);
		bySPA.HISTORY_INDEX++;
		bySPA.HISTORY_PATH[bySPA.HISTORY_INDEX] = url;
		history.pushState({ index: bySPA.HISTORY_INDEX, url }, "", `${bySPA.HOME_PATH}${url}`);
	};

	/**
	 * Replaces the current history state without creating a new entry.
	 * @param {string} url The URL to store in the current history entry.
	 */
	bySPA.historyReplace = function (url) {
		if (bySPA.HISTORY_INDEX < 0) bySPA.HISTORY_INDEX = 0;
		bySPA.HISTORY_PATH[bySPA.HISTORY_INDEX] = url;
		history.replaceState({ index: bySPA.HISTORY_INDEX, url }, "", `${bySPA.HOME_PATH}${url}`);
	};

	/**
	 * Displays an error page by sending an AJAX request to the server.
	 * @param {int} status HTTP status code.
	 * @param {string} custom_error_message A custom error message to display.
	 */
	bySPA.errorPage = function (status, custom_error_message = "") {
		const paths = [`${bySPA.HOME_PATH}/_error.php`, `${bySPA.HOME_PATH}/spa.php/_error.php`];
		const render = function (data) {
			document.documentElement.innerHTML = data;
			window.addEventListener(
				"popstate",
				function () {
					window.location.reload();
				},
				{ once: true }
			);
			return data;
		};
		const requestError = function (path) {
			return $.ajax({
				url: `${path}?e=${status}`,
				type: "POST",
				data: { custom_error_message },
				dataType: "text"
			})
				.then(render)
				.catch(function (xhr, ajaxStatus, error) {
					if (xhr?.responseText) return render(xhr.responseText);
					console.error(`Error (errorPage): ${xhr?.status} ${ajaxStatus} ${error}`, bySPA.APP_ENV == "DEV" ? xhr : "");
					return null;
				});
		};
		const loadError = function (paths, index = 0) {
			return remote_file_exists(paths[index]).then(function (exists) {
				if (exists) return requestError(paths[index]);
				if (index + 1 < paths.length) return loadError(paths, index + 1);
				console.error(`Error (errorPage): No error page found.`, bySPA.APP_ENV == "DEV" ? paths : "");
				return null;
			});
		};
		return loadError(paths);
	};

	/**
	 * Validates if the querySelector input is valid for use
	 * @param {string} selector The querySelector string to validate.
	 * @return {boolean} Validity of the selector input
	 */
	bySPA.validateQuerySelector = function (selector) {
		try {
			document.querySelector(selector);
			return true;
		} catch (e) {
			return false;
		}
	};

	/**
	 * Parses a querySelector and creates a corresponding jQuery element.
	 * @param {string} selector The querySelector string to parse. It supports tag name, ID, classes and attr.
	 * @return {jQuery} The created jQuery element based on the provided selector string.
	 */
	bySPA.parseQuerySelector = function (selector) {
		if (!bySPA.validateQuerySelector(selector)) return false;
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
	};

	/**
	 * Validates the ID of a querySelector to check in a element with that ID exists
	 * @param {string} selector The querySelector string to validate.
	 * @return {boolean} Whether the component ID exists
	 */
	bySPA.componentIdExists = function (selector) {
		const id = selector.match(/#[a-zA-Z0-9-_]+/);
		if (!id) {
			console.warn(`Insert a valid ID to search if a component exists...`);
			return false;
		}
		return $(id[0]).length;
	};

	/**
	 * Reloads a specific component to its elementID via an AJAX request.
	 * @param {string} component The selector for the component to reload.
	 * @param {string} file The file path to load the content from.
	 * @param {object} get The GET parameters to pass.
	 * @param {object} post The POST parameters to pass.
	 */
	bySPA.reloadComponent = function (component, file, get, post) {
		if (!component.includes("#")) return console.warn(`Can't use Component: ID${bySPA.APP_ENV === "DEV" ? " " + component : ""} isn't valid`);
		if (!bySPA.validateQuerySelector(component)) return console.warn(`Can't use Component: ${bySPA.APP_ENV === "DEV" ? component : ""} isn't valid`);
		if (!bySPA.componentIdExists(component)) {
			console.warn(`Component ${bySPA.APP_ENV === "DEV" ? "(" + component + ")" : " "} missing. Creating and appending to the body...`);
			if ($("#spa-content").length) $(bySPA.parseQuerySelector(component)).insertBefore("#spa-content");
			else $("body").append(bySPA.parseQuerySelector(component));
		}
		// If there's a component, extract the ID
		const componentId = component.match(/#[a-zA-Z0-9-_]+/)[0];
		// If no file is provided, clear the component's content
		if (!file || file == "null") return $(componentId).html("");
		return $.ajax({
			url: `${bySPA.HOME_PATH}${file}?${new URLSearchParams({ ...get, uri: false }).toString()}`,
			type: "POST",
			data: { ...post },
			dataType: "text"
		})
			.then(function (data) {
				$(componentId).html(data);
				return data;
			})
			.catch(function (xhr, status, error) {
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
	 * @param {string} uri The URI to route.
	 * @return {object} An object containing the routed path, URI, file, parameters, and components.
	 */
	bySPA.routeURL = function (uri = "/") {
		// Parse the URI into path and parameters
		const { path, params, query, url } = bySPA.parseURL(uri);
		// Check if the path exists in the defined routes
		if (!Object.keys(bySPA.ROUTES).includes(path)) return null;
		const route = bySPA.ROUTES[path] ?? {};
		const get = { ...(route?.GET ?? {}), ...params, ...query };
		const post = { ...(route?.POST ?? {}) };
		// Determine the final URI based on the route
		uri = route?.URI;
		// Determine the correct URI if it's not explicitly set
		if (uri == "") {
			get.uri = bySPA.URI || "/";
			uri = bySPA.ROUTES[get.uri]?.URI ? bySPA.ROUTES[get.uri]?.URI : bySPA.ROUTES["/"]?.URI;
		} else get.uri = path;
		bySPA.setRouteState({ path, url, get, post });
		return { path, url, uri, file: route?.FILE, get, post, component: route?.COMPONENT };
	};

	/**
	 * Loads the SPA content for the given URL, optionally pushing the state to history.
	 * @param {string} url The URL to load.
	 * @param {object} mode History handling options.
	 */
	bySPA.load = function (url, mode = { push: true }) {
		const historyMode = typeof mode === "object" ? mode : {};
		$("#spa-loader").fadeIn(1);
		const routing = bySPA.routeURL(`${url}`);
		// If routing fails, return early
		if (!routing)
			return bySPA.errorPage(404, `Route "${url}" does not exist.`).always(function () {
				setTimeout(() => $("#spa-loader").fadeOut(333), 333);
			});
		if (historyMode.push) bySPA.historyPush(routing.url);
		if (historyMode.replace) bySPA.historyReplace(routing.url);
		$("#spa-content").html("");
		const { path, uri, file, get, post, component } = routing;
		// Log debug information if in development mode
		if (bySPA.APP_ENV === "DEV") {
			console.log(`loadSPA("${url}")`);
			console.log("routeURL(): PATH=", path, "; URI=", uri, "; FILE=", file, "; _GET=", get, "; _POST=", post, "; COMPONENT=", component);
		}
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
		for (let key in component || {}) componentLoads.push(bySPA.reloadComponent(key, component[key], get, post));
		// Retrieve the page data
		return $.ajax({
			url: `${bySPA.HOME_PATH}${uri ?? "/null"}?${new URLSearchParams(get).toString()}`,
			type: "POST",
			data: { ...post },
			dataType: "text"
		})
			.then(function (data) {
				$("#spa-content").html(data);
				return Promise.allSettled(componentLoads.map((load) => Promise.resolve(load))).then(function () {
					bySPA.afterLoad(routing);
					return data;
				});
			})
			.catch(function (xhr, status, error) {
				console.error(`Error (SPA): ${xhr?.status} ${status} ${error}`, bySPA.APP_ENV == "DEV" ? xhr : "");
				document.documentElement.innerHTML = xhr.responseText;
				window.addEventListener(
					"popstate",
					function () {
						window.location.reload();
					},
					{ once: true }
				);
				return null;
			})
			.always(function () {
				setTimeout(() => $("#spa-loader").fadeOut(333), 333);
			});
	};

	/**
	 * Runs page/component lifecycle hooks after dynamic content is swapped.
	 * @param {object} routing The route data that was loaded.
	 */
	bySPA.afterLoad = function (routing) {
		if (typeof byCommon !== "undefined" && byCommon) {
			["initMisc", "initBootstrap", "initCaptcha", "initSidebar"].forEach(function (fn) {
				if (typeof byCommon[fn] === "function") byCommon[fn]();
			});
		}
		document.dispatchEvent(new CustomEvent("byspa:load", { detail: routing }));
	};

	bySPA.init = function () {
		if (typeof jQuery === "undefined" && !window.jQuery) return console.error("Init _spa.js FAILED. No jQuery found.");
		// Log debug information if in development mode
		if (bySPA.APP_ENV === "DEV") {
			console.log("APP_VERSION=", bySPA.APP_VERSION);
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
			if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
			let nextURL = href;
			try {
				const absolute = new URL(href, window.location.href);
				if (absolute.origin != window.location.origin) return;
				nextURL = bySPA.HOME_PATH && absolute.href.startsWith(bySPA.HOME_PATH) ? absolute.href.slice(bySPA.HOME_PATH.length) || "/" : `${absolute.pathname}${absolute.search}`;
			} catch (error) {
				return;
			}
			e.preventDefault();
			bySPA.load(nextURL);
		});
		// Initial load of SPA content based on the stored URL.
		bySPA.load(`${bySPA.URL}`, { replace: true });
	};
})(typeof window !== "undefined" ? window : this);

bySPA.init();
