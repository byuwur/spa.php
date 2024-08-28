"use strict";
/*
 * File: _spa.js
 * Desc: Manages the Single Page Application (SPA) functionality, including routing, state management, and AJAX loading of content.
 * Deps: jQuery
 * Copyright (c) 2023 Andrés Trujillo [Mateus] byUwUr
 */

function initSPA() {
	if (typeof jQuery === "undefined" && window.jQuery === undefined) return console.error("Init _spa.js FAILED. No jQuery found.");
	// Initializes values retrieved from localStorage and sets up environment variables.
	let URI = localStorage.getItem("URI"),
		_URL = localStorage.getItem("URL"),
		_GET = JSON.parse(localStorage.getItem("_GET")),
		_POST = JSON.parse(localStorage.getItem("_POST")),
		HISTORY_INDEX = -1;
	const APP_ENV = localStorage.getItem("APP_ENV"),
		ROUTES = JSON.parse(localStorage.getItem("ROUTES")),
		TO_HOME = localStorage.getItem("TO_HOME"),
		HOME_PATH = localStorage.getItem("HOME_PATH"),
		HISTORY_PATH = [];
	console.log("Init _spa.js:", APP_ENV);
	// Log debug information if in development mode
	if (APP_ENV === "DEV") {
		console.log("TO_HOME=", TO_HOME);
		console.log("HOME_PATH=", HOME_PATH);
		console.log("URI=", URI);
		console.log("_URL=", _URL);
		console.log("ROUTES=", ROUTES);
		console.log("_GET=", _GET);
		console.log("_POST=", _POST);
		console.log("HISTORY_INDEX=", HISTORY_INDEX);
		console.log("HISTORY_PATH=", HISTORY_PATH);
	}

	/**
	 * Updates local variables with the latest data from localStorage.
	 */
	function getLocalStorageItems() {
		URI = localStorage.getItem("URI");
		_URL = localStorage.getItem("URL");
		_GET = JSON.parse(localStorage.getItem("_GET"));
		_POST = JSON.parse(localStorage.getItem("_POST"));
	}

	/**
	 * Pushes the current state to the browser's history stack.
	 * @param {string} url The URL to push to the history stack.
	 */
	function historyPushState(url) {
		HISTORY_INDEX++;
		HISTORY_PATH[HISTORY_INDEX] = url;
		history.pushState({ index: HISTORY_INDEX }, "", `${HOME_PATH}${url}`);
	}

	/**
	 * Displays an error page by sending an AJAX request to the server.
	 * @param {int} status HTTP status code.
	 * @param {string} custom_error_message A custom error message to display.
	 */
	function errorPage(status, custom_error_message = "") {
		const printError = (data) => {
			document.write(data);
			// Reinitialize necessary variables and attach event listeners for history management. (Be able to go back)
			$("head").append(`<script>
				let _GET = ${JSON.stringify(_GET)}, _POST = ${JSON.stringify(_POST)}, HISTORY_INDEX = ${HISTORY_INDEX};
				const ROUTES = ${JSON.stringify(ROUTES)}, TO_HOME = "${TO_HOME}", HOME_PATH = "${HOME_PATH}",
					HISTORY_PATH = ${JSON.stringify(HISTORY_PATH)}, APP_ENV = "${APP_ENV}",
					parseURL = ${parseURL}, routeURL = ${routeURL}, loadSPA = ${loadSPA}, getLocalStorageItems = ${getLocalStorageItems};
				window.addEventListener("popstate", function (e) {
					if (APP_ENV === 'DEV') console.log('errorPage=history.back()');
					HISTORY_INDEX = e.state.index;
					loadSPA(HISTORY_PATH[HISTORY_INDEX], false);
				});
			</script>`);
		};
		$.ajax({
			url: `${HOME_PATH}/_error.php?e=${status}`,
			type: "POST",
			data: { custom_error_message },
			success: function (data) {
				printError(data);
			},
			error: function (xhr, status, error) {
				printError(xhr?.responseText);
				console.error(`Error loading errorPage: ${xhr?.status} ${status} ${error}`, APP_ENV == "DEV" ? xhr : "");
			}
		});
	}

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
	 * @return {}
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
	 */
	function reloadComponent(component, file, get, post) {
		if (!component.includes("#")) return console.warn(`Can't use Component: ID${APP_ENV === "DEV" ? " " + component : ""} isn't valid`);
		if (!validateQuerySelector(component)) return console.warn(`Can't use Component: ${APP_ENV === "DEV" ? component : ""} isn't valid`);
		if (!componentIdExists(component)) {
			console.warn(`Component ${APP_ENV === "DEV" ? "(" + component + ")" : " "} missing. Creating and appending to the body...`);
			$("body").append(parseQuerySelector(component));
		}
		// If there's a component extract the ID
		const componentId = component.match(/#[a-zA-Z0-9-_]+/)[0];
		// If no file is provided, clear the component's content
		if (!file || file == "" || file == "null") return $(componentId).html("");
		$.ajax({
			url: `${HOME_PATH}${file}?${new URLSearchParams({ ...get, uri: false }).toString()}`,
			type: "POST",
			data: { ...post },
			success: function (data) {
				$(componentId).html(data);
			},
			error: function (xhr, status, error) {
				$(componentId).html("");
				console.warn(`Error loading component: ${xhr?.status} ${status} ${error}`, APP_ENV == "DEV" ? xhr : "");
			}
		});
	}

	/**
	 * Parses the given URI into a path and associated parameters.
	 * @param {string} uri The URI to parse.
	 * @return {object} An object containing the path and parameters.
	 */
	function parseURL(uri = "/") {
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
	}

	/**
	 * Routes the given URI within the SPA, managing state and navigation.
	 * @param {string} uri The URI to route.
	 * @return {object} An object containing the routed path, URI, file, parameters, and components.
	 */
	function routeURL(uri = "/") {
		// Parse the URI into path and parameters
		const { path, params } = parseURL(uri);
		// Check if the path exists in the defined routes
		if (!Object.keys(ROUTES).includes(path) || !Object.keys(ROUTES).length) return errorPage(404, `Route "${uri}" does not exist.`);
		localStorage.setItem("URI", path);
		localStorage.setItem("_GET", JSON.stringify({ ..._GET, ...(ROUTES[path]?.GET ?? []), ...params }));
		localStorage.setItem("_POST", JSON.stringify({ ..._POST, ...(ROUTES[path]?.POST ?? []) }));
		getLocalStorageItems();
		// Determine the final URI based on the route
		uri = ROUTES[path]?.URI;
		// Determine the correct URI if it's not explicitly set
		if (uri == "") uri = _GET["uri"] ? (ROUTES[_GET["uri"]]?.URI ? ROUTES[_GET["uri"]]?.URI : ROUTES["/"]?.URI) : ROUTES["/"]?.URI;
		else _GET["uri"] = URI;
		return { path, uri, file: ROUTES[path]?.FILE, get: _GET, post: _POST, component: ROUTES[path]?.COMPONENT };
	}

	/**
	 * Loads the SPA content for the given URL, optionally pushing the state to history.
	 * @param {string} url The URL to load.
	 * @param {boolean} push Whether to push the state to the browser history.
	 */
	function loadSPA(url, push = true) {
		$("#spa-loader").fadeIn(1);
		$("#spa-content").html("");
		if (push) historyPushState(url);
		const routing = routeURL(`${url}`);
		// If routing fails, return early
		if (!routing) return console.warn(`No routing available when going to "${url}"`);
		const { path, uri, file, get, post, component } = routing;
		// Log debug information if in development mode
		if (APP_ENV === "DEV") {
			console.log(`loadSPA("${url}")`);
			console.log("routeURL(): PATH=", path, "; URI=", uri, "; FILE=", file, "; _GET=", get, "; _POST=", post, "; COMPONENT=", component);
		}
		// If a file is specified in the route, navigate to it directly
		if (file) return (window.location = `${HOME_PATH}${path}`);
		// If the SPA container is missing, create the element
		if (!$("#spa-content").length) {
			// Check if it can continue, if not reload completely
			if (typeof reloadComponent === "undefined") return window.location.reload();
			console.warn("Main Component (main#spa-content) missing. Creating and appending to the body...");
			$("body").append(
				$("<main>", {
					id: "spa-content"
				})
			);
		}
		// Reload each component associated with the route
		for (let key in component) reloadComponent(key, component[key], get, post);
		// Retrieve the page data
		$.ajax({
			url: `${HOME_PATH}${uri}?${new URLSearchParams(get).toString()}`,
			type: "POST",
			data: { ...post },
			success: function (data) {
				$("#spa-content").html(data);
			},
			error: function (xhr, status, error) {
				console.error(`Error loading SPA: ${xhr?.status} ${status} ${error}`, APP_ENV == "DEV" ? xhr : "");
				// Display an error page if the route does not exist
				errorPage(404, `Route "${url}" does not exist.`);
			},
			complete: function () {
				setTimeout(() => $("#spa-loader").fadeOut(333), 333);
			}
		});
	}

	// Handles the popstate event for navigating through browser history.
	window.addEventListener("popstate", function (e) {
		if (!e.state || e.state.index == undefined) return;
		HISTORY_INDEX = e.state.index;
		loadSPA(HISTORY_PATH[HISTORY_INDEX], false);
		if (APP_ENV === "DEV") console.log("HISTORY_INDEX=", HISTORY_INDEX, "; HISTORY_PATH=", HISTORY_PATH);
	});
	// Attaches click event handlers to links for SPA navigation.
	$(document).on("click", "a:not([target='_blank']):not([href^='#']):not([href^='javascript:']):not([custom-folder='true'])", function (e) {
		e.preventDefault();
		loadSPA($(this).attr("href"));
	});
	// Initial load of SPA content based on the stored _URL.
	loadSPA(`${_URL}`);
}

initSPA();
