"use strict";
/*
 * File: _spa.js
 * Desc: Manages the Single Page Application (SPA) functionality, including routing, state management, and AJAX loading of content.
 * Deps: jQuery
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
	bySPA.URI = localStorage.getItem("URI");
	bySPA.URL = localStorage.getItem("URL");
	bySPA._GET = JSON.parse(localStorage.getItem("_GET"));
	bySPA._POST = JSON.parse(localStorage.getItem("_POST"));
	bySPA.HISTORY_INDEX = -1;
	bySPA.APP_ENV = localStorage.getItem("APP_ENV");
	bySPA.APP_VERSION = localStorage.getItem("APP_VERSION");
	bySPA.ROUTES = JSON.parse(localStorage.getItem("ROUTES"));
	bySPA.TO_HOME = localStorage.getItem("TO_HOME");
	bySPA.HOME_PATH = localStorage.getItem("HOME_PATH");
	bySPA.HISTORY_PATH = [];

	/**
	 * Updates local variables with the latest data from localStorage.
	 */
	bySPA.getLocalStorageItems = function () {
		bySPA.URI = localStorage.getItem("URI");
		bySPA.URL = localStorage.getItem("URL");
		bySPA._GET = JSON.parse(localStorage.getItem("_GET"));
		bySPA._POST = JSON.parse(localStorage.getItem("_POST"));
	};

	/**
	 * Pushes the current state to the browser's history stack.
	 * @param {string} url The URL to push to the history stack.
	 */
	bySPA.historyPush = function (url) {
		bySPA.HISTORY_INDEX++;
		bySPA.HISTORY_PATH[bySPA.HISTORY_INDEX] = url;
		history.pushState({ index: bySPA.HISTORY_INDEX }, "", `${bySPA.HOME_PATH}${url}`);
	};

	/**
	 * Displays an error page by sending an AJAX request to the server.
	 * @param {int} status HTTP status code.
	 * @param {string} custom_error_message A custom error message to display.
	 */
	bySPA.errorPage = function (status, custom_error_message = "") {
		const printError = (data) => {
			document.write(data);
			// Reinitialize necessary variables and attach event listeners for history management. (Be able to go back)
			$("head").append(`<script>
                    let _GET = ${JSON.stringify(bySPA._GET)}, _POST = ${JSON.stringify(bySPA._POST)}, HISTORY_INDEX = ${bySPA.HISTORY_INDEX};
                    const ROUTES = ${JSON.stringify(bySPA.ROUTES)}, TO_HOME = "${bySPA.TO_HOME}", HOME_PATH = "${bySPA.HOME_PATH}",
                        HISTORY_PATH = ${JSON.stringify(bySPA.HISTORY_PATH)}, APP_ENV = "${bySPA.APP_ENV}",
                        parseURL = ${bySPA.parseURL}, routeURL = ${bySPA.routeURL}, load = ${bySPA.load}, getLocalStorageItems = ${bySPA.getLocalStorageItems};
                    window.addEventListener("popstate", function (e) {
                        if (APP_ENV === 'DEV') console.log('errorPage=history.back()');
                        HISTORY_INDEX = e.state.index;
                        load(HISTORY_PATH[HISTORY_INDEX], false);
                    });
                </script>`);
		};
		return $.ajax({
			url: `${bySPA.HOME_PATH}/_error.php?e=${status}`,
			type: "POST",
			data: { custom_error_message },
			dataType: "text"
		})
			.then(function (data) {
				printError(data);
				return data;
			})
			.catch(function (xhr, status, error) {
				console.error(`Error (errorPage): ${xhr?.status} ${status} ${error}`, bySPA.APP_ENV == "DEV" ? xhr : "");
				printError(xhr?.responseText);
				return null;
			});
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
		if (!file || file == "" || file == "null") return $(componentId).html("");
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
		// Ensure the URI starts with a "/" and doesn't end with one
		while (uri.length > 0 && !uri.startsWith("/")) uri = uri.substring(1);
		while (uri.length > 1 && uri.endsWith("/")) uri = uri.substring(0, uri.length - 1);
		// Handle URI parameters if present
		if (!uri.includes("/$/")) return { path: uri, params: {} };
		const [path, param] = uri.split("/$/", 2);
		const keyValuePairs = param.split("/");
		const params = {};
		// Iterate over the parameters and store them as key-value pairs
		for (let i = 0; i < keyValuePairs.length; i += 2) if (keyValuePairs[i + 1] !== undefined) params[keyValuePairs[i]] = keyValuePairs[i + 1];
		return { path, params };
	};

	/**
	 * Routes the given URI within the SPA, managing state and navigation.
	 * @param {string} uri The URI to route.
	 * @return {object} An object containing the routed path, URI, file, parameters, and components.
	 */
	bySPA.routeURL = function (uri = "/") {
		// Parse the URI into path and parameters
		const { path, params } = bySPA.parseURL(uri);
		// Check if the path exists in the defined routes
		if (!Object.keys(bySPA.ROUTES).includes(path) || !Object.keys(bySPA.ROUTES).length) return bySPA.errorPage(404, `Route "${uri}" does not exist.`);
		localStorage.setItem("URI", path);
		localStorage.setItem("_GET", JSON.stringify({ ...bySPA._GET, ...(bySPA.ROUTES[path]?.GET ?? []), ...params }));
		localStorage.setItem("_POST", JSON.stringify({ ...bySPA._POST, ...(bySPA.ROUTES[path]?.POST ?? []) }));
		bySPA.getLocalStorageItems();
		// Determine the final URI based on the route
		uri = bySPA.ROUTES[path]?.URI;
		// Determine the correct URI if it's not explicitly set
		if (uri == "") uri = bySPA._GET["uri"] ? (bySPA.ROUTES[bySPA._GET["uri"]]?.URI ? bySPA.ROUTES[bySPA._GET["uri"]]?.URI : bySPA.ROUTES["/"]?.URI) : bySPA.ROUTES["/"]?.URI;
		else bySPA._GET["uri"] = bySPA.URI;
		return { path, uri, file: bySPA.ROUTES[path]?.FILE, get: bySPA._GET, post: bySPA._POST, component: bySPA.ROUTES[path]?.COMPONENT };
	};

	/**
	 * Loads the SPA content for the given URL, optionally pushing the state to history.
	 * @param {string} url The URL to load.
	 * @param {boolean} push Whether to push the state to the browser history.
	 */
	bySPA.load = function (url, push = true) {
		$("#spa-loader").fadeIn(1);
		$("#spa-content").html("");
		if (push) bySPA.historyPush(url);
		const routing = bySPA.routeURL(`${url}`);
		// If routing fails, return early
		if (!routing) return console.warn(`No routing available when going to "${url}"`);
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
			if (!bySPA.reloadComponent || typeof reloadComponent === "undefined") return window.location.reload();
			console.warn("Main Component (main#spa-content) missing. Creating and appending to the body...");
			$("body").append(
				$("<main>", {
					id: "spa-content"
				})
			);
		}
		// Reload each component associated with the route
		for (let key in component) bySPA.reloadComponent(key, component[key], get, post);
		// Retrieve the page data
		return $.ajax({
			url: `${bySPA.HOME_PATH}${uri}?${new URLSearchParams(get).toString()}`,
			type: "POST",
			data: { ...post },
			dataType: "text"
		})
			.then(function (data) {
				$("#spa-content").html(data);
				return data;
			})
			.catch(function (xhr, status, error) {
				console.error(`Error (SPA): ${xhr?.status} ${status} ${error}`, bySPA.APP_ENV == "DEV" ? xhr : "");
				bySPA.errorPage(404, `Route "${url}" does not exist.`);
				return null;
			})
			.always(function () {
				setTimeout(() => $("#spa-loader").fadeOut(333), 333);
			});
	};

	bySPA.init = function () {
		if (typeof jQuery === "undefined" && window.jQuery === undefined) return console.error("Init _spa.js FAILED. No jQuery found.");
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
			if (!e.state || e.state.index == undefined) return;
			bySPA.HISTORY_INDEX = e.state.index;
			bySPA.load(bySPA.HISTORY_PATH[bySPA.HISTORY_INDEX], false);
			if (bySPA.APP_ENV === "DEV") console.log("HISTORY_INDEX=", bySPA.HISTORY_INDEX, "; HISTORY_PATH=", bySPA.HISTORY_PATH);
		});
		// Attaches click event handlers to links for SPA navigation.
		$(document).on("click", "a:not([target='_blank']):not([href^='#']):not([href^='javascript:']):not([custom-folder='true'])", function (e) {
			e.preventDefault();
			bySPA.load($(this).attr("href"));
		});
		// Initial load of SPA content based on the stored URL.
		bySPA.load(`${bySPA.URL}`);
	};
})(typeof window !== "undefined" ? window : this);

bySPA.init();
