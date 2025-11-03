"use strict";
/*
 * File: _functions.js
 * Desc: Contains common standalone functions that are used project-wide. In hopes that the function names doesn't collide with global.
 * Deps: jQuery
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

/**
 * Checks whether a value is valid JSON.
 * @param {any} json The data to check.
 * @return {boolean} Whether the input is a valid JSON string.
 */
function check_json(json) {
	if (typeof json !== "string") return false;
	try {
		JSON.parse(json);
		return true;
	} catch {
		return false;
	}
}

/**
 * Returns a pretty-printed JSON string.
 * If the input is already JSON, it normalizes it.
 * @param {any} json The data to format.
 * @return {string} JSON-formatted string.
 */
function print_json(json) {
	let output = null;
	if (check_json(json)) output = JSON.stringify(JSON.parse(json), null, 2);
	else output = JSON.stringify(json, null, 2);
	return output;
}

/**
 * Logs a JSON response and stops further execution.
 * (JS version: it just throws a special object to simulate termination)
 * @param {any} json The data to output.
 * @return {never}
 */
function exit_json(json) {
	console.warn(print_json(json));
	throw new Error("exit_json: Script terminated after sending JSON response.");
}

/**
 * Inits a websocket connection.
 * @param {object} options Options for the websocket connection.
 * @param {string} options.host The host where you wish to connect.
 * @param {int} options.port The port of the host.
 * @param {string} options.path The path where the websocket is exposed.
 * @param {string} options.elementId The element where you want to render the websocket.
 * @param {boolean} [options.autoConnect=true] Log websocket data on the element.
 * @param {boolean} [options.logging=false] Log websocket data on the element.
 * @param {Function} [options.onOpen=()=>{}] onOpen trigger for websocket.
 * @param {Function} [options.onClose=()=>{}] onClose trigger for websocket.
 * @param {Function} [options.onError=()=>{}] onError trigger for websocket.
 * @param {Function} [options.onMessage=()=>{}] onMessage trigger for websocket.
 * @param {int} [options.reconnDelay=3000] How long to wait between reconnections in ms.
 * @param {int} [options.maxRetries=3] How many reconnections tries.
 * @return {object} Returns the ws object for further manipulation.
 */
function init_websocket(options) {
	const { host, port, path, elementId, autoConnect = true, logging = false, onOpen = () => {}, onClose = () => {}, onError = () => {}, onMessage = () => {}, reconnDelay = 3000, maxRetries = 3 } = options;
	// Developer mode?
	const appIsDEV = localStorage.getItem("APP_ENV") === "DEV";
	if (appIsDEV) console.log(`init_websocket():`, options);
	// Check if elementId is a valid ID (#id)
	const inputId = elementId.match(/#[a-zA-Z0-9-_]+/);
	if (!inputId) return console.warn(`Insert a valid element ID.`);
	// Look up ID existence
	const elId = inputId[0];
	if (!$(elId).length) return console.warn(`Element ID (${elId}) doesn't exist.`);
	// Init websocket

	const ws_path = `ws://${host}:${port}/${path}`;
	let ws = undefined;
	let retries = 0;
	let closedManually = false;

	const logToEl = (label, data = "") => {
		if (!logging) return;
		let content = data;
		if (check_json(content)) content = JSON.stringify(JSON.parse(content), null, 2);
		const now = new Date().toISOString().replace("T", "_").replace(/:/g, "-").split(".")[0];
		const $pre = $("<pre>").text(`${label}: [${now}]\n${data}`);
		$(elId).append($pre);
	};

	function connect() {
		if (ws && ws?.readyState === WebSocket.OPEN) return;
		console.log(`ws${appIsDEV ? `: ${ws_path}` : `.`}`);
		ws = new WebSocket(ws_path);
		logToEl(`ws`, `Connecting...`);

		ws.onopen = (e) => {
			if (appIsDEV) console.log("ws.onopen:", e);
			retries = 0;
			logToEl(`ws.onopen`, `Connection established.`);
			onOpen(e);
		};
		ws.onclose = (e) => {
			if (appIsDEV) console.log("ws.onclose:", e);
			logToEl(`ws.onclose`, `Connection closed. (${e.code})`);
			onClose(e);
			if (!closedManually && retries < maxRetries) retry();
			else logToEl(`ws.retry`, `Max retries reached (${maxRetries})`);
		};
		ws.onerror = (e) => {
			if (appIsDEV) console.log("ws.onerror:", e);
			logToEl(`ws.onerror`, `Connection failed.`);
			onError(e);
			ws.close();
		};
		ws.onmessage = (e) => {
			if (appIsDEV) console.log("ws.onmessage:", e);
			logToEl(`ws.onmessage`, e.data || `[no data]`);
			onMessage(e);
		};
	}

	function retry() {
		if (retries > maxRetries) {
			logToEl(`ws.retry`, `Max retries reached (${maxRetries})`);
			return;
		}
		retries++;
		logToEl(`ws.retry`, `Reconnection attempt (${retries}) in ${reconnDelay / 1000} seconds...`);
		setTimeout(connect, reconnDelay);
	}

	if (autoConnect) connect();

	return {
		get ws() {
			return ws;
		},
		get readyState() {
			return ws?.readyState;
		},
		connect: () => {
			// Do more if needed
			connect();
		},
		close: () => {
			closedManually = true;
			retries = maxRetries;
			ws?.close();
		},
		retry: () => {
			closedManually = false;
			retries = 0;
			retry();
		},
		send: (data) => {
			if (!ws || ws.readyState !== WebSocket.OPEN) {
				console.warn("⚠️ Cannot send — socket not open");
				return;
			}
			let parsedData = data;
			if (check_json(data)) parsedData = JSON.stringify(JSON.parse(parsedData), null, 2);
			else parsedData = JSON.stringify(parsedData, null, 2);
			ws?.send(parsedData);
		}
	};
}

/**
 * Creates or updates a cookie with the specified name, value, and expiration days.
 * @param {string} name The name of the cookie.
 * @param {string} value The value of the cookie.
 * @param {number} [minutes=31536000] (Default 1y) The number of days until the cookie expires. A negative number expires the cookie.
 */
function set_cookie(name, value, minutes = 31536000) {
	document.cookie = `${name}=${encodeURIComponent(value)};max-age=${minutes};path=/`;
}

/**
 * Retrieves the value of the cookie with the specified name.
 * @param {string} name The name of the cookie to retrieve.
 * @return {string | null} The value of the cookie or null if not found.
 */
function get_cookie(name) {
	return `; ${document.cookie}`.split(`; ${name}=`).pop().split(";").shift() || null;
}

/**
 * Creates a debounced function that delays the execution of the provided function (`func`)
 * @param {Function} func The function to debounce. This is the function that will be delayed in execution.
 * @param {number} wait (Default 111) The number of milliseconds to wait before executing the `func`.
 * @return {Function} Returns a new debounced version of the `func` that delays its execution.
 */
function debounce(func, wait = 250) {
	let timeout;
	return function () {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, arguments), wait);
	};
}

/**
 * Hides and removes the front modal from the DOM after a short delay.
 * @param {string} $modalId The ID of the modal element
 * @param {boolean} $delay Whether delays its detruction or not.
 */
function destroy_modal_front($modalId, $delay = true) {
	if (!$(`#${$modalId}`).length) return console.log(`Modal #${$modalId} doesn't exist...`);
	$(`#${$modalId}`).modal("hide");
	setTimeout(() => $(`#${$modalId}`).remove(), $delay ? 333 : 1);
}

/**
 * Displays a Bootstrap modal with a customizable message and actions.
 * @param {string} $modalId The ID of the modal element
 * @param {string} $state The state of the modal (e.g., success, danger, info, warning).
 * @param {string} $title The title of the modal.
 * @param {string} $message The message to display in the modal.
 * @param {boolean} $hideCancelBtn Whether to hide the cancel button.
 * @param {string} $redirect The URL to redirect to when "OK" is clicked.
 */
function show_modal_front($modalId, $state = "success", $title = "INFO.", $message = "Message.", $hideCancelBtn = false, $redirect = `javascript:destroy_modal_front('${$modalId}');`) {
	// If already exist, destroy it with no delay
	if ($(`#${$modalId}`).length) destroy_modal_front($modalId, false);
	// HTML structure for the modal
	const modal_front = `<div id="${$modalId}" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel">
        <div id="${$modalId}_container" class="modal-dialog modal-dialog-scrollable">
            <div class="modal-content">
                <div id="${$modalId}_title" class="modal-header m-0 fs-5 alert alert-${$state}">${$title}</div>
                <div id="${$modalId}_body" class="modal-body text-dark">${$message}</div>
                <div class="modal-footer">
                    <a id="${$modalId}_back" class="btn btn-dark" href="javascript:destroy_modal_front('${$modalId}');" onclick="javascript:destroy_modal_front('${$modalId}');">CANCEL</a>
                    <a id="${$modalId}_ok" class="btn btn-success" href="${$redirect}">OK</a>
                </div>
            </div>
        </div>
    </div>`;
	// Append it to the <body>
	$("body").append(modal_front);
	$hideCancelBtn ? $(`#${$modalId}_back`).addClass("d-none") : $(`#${$modalId}_back`).removeClass("d-none");
	// Center if window size merits and show
	window.innerWidth < 992 ? $(`#${$modalId}_container`).addClass("modal-dialog-centered") : $(`#${$modalId}_container`).removeClass("modal-dialog-centered");
	$(`#${$modalId}`).modal("show");
}

/**
 * Makes an HTTP POST request to a given URL with optional GET and POST parameters.
 * @param {Object} options The options for the HTTP request.
 * @param {string} options.$elementId The element selector triggering the request (debug identification only).
 * @param {string} options.$url The URL to which the HTTP request is sent.
 * @param {string} [options.$type="POST"] The query type (e.g., "POST", "GET", "PUT").
 * @param {string} [options.$returnType="json"] The expected return type (e.g., "json", "text", "html").
 * @param {Object} [options.$_get={}] An object representing the GET parameters to append to the URL.
 * @param {Array} [options.$_post=[]] An array of additional POST parameters to include in the request.
 * @param {Object} [options.ajaxOpts={}] Additional options added to the AJAX request if needed (e.g., async)
 * @param {boolean} [options.loudFail=false] (Default False) Defines if the error is displayed with the modal or console only.
 */
function make_http_request(options) {
	const { $elementId, $url, $type = "POST", $returnType = "json", $_get = {}, $_post = [], ajaxOpts = {}, loudFail = false } = options;
	// Developer mode?
	const appIsDEV = localStorage.getItem("APP_ENV") === "DEV";
	// Check if $elementId is a valid ID (#id)
	const inputId = $elementId.match(/#[a-zA-Z0-9-_]+/);
	if (!inputId) return console.warn(`Insert a valid element ID.`);
	// Look up ID existence
	const elementId = inputId[0];
	if (!$(elementId).length) return console.warn(`Element ID (${elementId}) doesn't exist.`);
	// Prepare URL for callback
	if ($url.includes("?")) console.warn(`URL (${elementId}) shouldn't have GET in itself since they're ignored. Use $_get Object instead.`);
	const inputUrl = $url.match(/^[^?]+/);
	const urlGet = `${inputUrl[0]}?${new URLSearchParams($_get).toString()}`;
	// Start request
	const formData = [];
	$_post.forEach((post) => {
		formData.push({
			name: post?.name,
			value: post?.value
		});
	});
	if (appIsDEV) {
		console.log(`element_make_http_request():`, options);
		console.log(`HTTP (${elementId}):${$returnType} to ${urlGet} `, formData);
	}
	return $.ajax({
		...ajaxOpts,
		url: urlGet,
		type: $type,
		data: formData,
		dataType: $returnType
	})
		.then(function (response) {
			if (appIsDEV) console.log(`Response (${elementId}):`, response);
			if (loudFail && ![200, 201, 202].includes(response?.status))
				return show_modal_front("modal_front", "danger", "ERROR", "Ocurrió un error.<br>Disculpe las molestias, intente nuevamente.<br><code>(" + response?.message + ")</code>", true);
			return response?.data ?? response;
		})
		.catch(function (xhr, status, error) {
			console.error(`Error (${elementId}): ${xhr?.status} ${status} ${error} "${xhr?.responseJSON?.message ?? xhr?.responseText}"`, appIsDEV ? xhr : "");
			if (loudFail) show_modal_front("modal_front", "danger", "ERROR", "Ocurrió un error.<br>Disculpe las molestias, intente nuevamente.<br><code>(" + (xhr?.responseJSON?.message ?? xhr?.responseText) + ")</code>", true);
			return null;
		});
}

/**
 * Assign an AJAX callback which makes an HTTP POST request to a given URL with optional GET and POST parameters.
 * Since this is for the frontend we specify the element and what trigger is associated to.
 * Originally meant for use with <forms />
 * @param {Object} options The options for the HTTP request.
 * @param {string} options.$elementId The element selector to serialize and send.
 * @param {string} [options.$trigger="submit"] The event listener added to the element.
 * @param {string} options.$url The URL to which the HTTP request is sent.
 * @param {string} [options.$type="POST"] The query type (e.g., "POST", "GET", "PUT").
 * @param {string} [options.$returnType="json"] The expected return type (e.g., "json", "text", "html").
 * @param {Object} [options.$_get={}] An object representing the GET parameters to append to the URL.
 * @param {Array} [options.$_post=[]] An array of additional POST parameters to include in the request.
 * @param {Function} [options.beforeFn=()=>{}] A callback function to be executed before the request happens.
 * @param {Function} [options.doneFn=()=>{}] A callback function to be executed if the request succeeds.
 * @param {Function} [options.failFn=()=>{}] A callback function to be executed if the request fails.
 * @param {Function} [options.alwaysFn=()=>{}] A callback function to be executed after the request happens.
 * @param {Object} [options.ajaxOpts={}] Additional options added to the AJAX request if needed (e.g., async)
 * @param {boolean} [options.loudFail=true] (Default True) Defines if the error is displayed with the modal or console only.
 */
function element_make_http_request(options) {
	const { $elementId, $trigger = "submit", $url, $type = "POST", $returnType = "json", $_get = {}, $_post = [], beforeFn = () => {}, doneFn = () => {}, failFn = () => {}, alwaysFn = () => {}, ajaxOpts = {}, loudFail = true } = options;
	// Developer mode?
	const appIsDEV = localStorage.getItem("APP_ENV") === "DEV";
	if (appIsDEV) console.log(`element_make_http_request():`, options);
	// Check if $elementId is a valid ID (#id)
	const inputId = $elementId.match(/#[a-zA-Z0-9-_]+/);
	if (!inputId) return console.warn(`Insert a valid element ID.`);
	// Look up ID existence
	const elementId = inputId[0];
	if (!$(elementId).length) return console.warn(`Element ID (${elementId}) doesn't exist.`);
	// Look up the submit button inside the form
	const submitBtn = $(elementId).find("button[type='submit'], input[type='submit'], [type='submit']");
	if (!submitBtn.length) console.warn(`Submit (${elementId}) not found.`);
	// Look up the spinner inside the submit button
	const spinner = submitBtn.find(".spinner-border, .spinner-grow");
	// Prepare URL for callback
	if ($url.includes("?")) console.warn(`URL (${elementId}) shouldn't have GET in itself since they're ignored. Use $_get Object instead.`);
	const inputUrl = $url.match(/^[^?]+/);
	const urlGet = `${inputUrl[0]}?${new URLSearchParams($_get).toString()}`;
	// Start request
	$(elementId)
		.off($trigger)
		.on($trigger, function (event) {
			event.preventDefault();
			submitBtn.attr("disabled", true);
			spinner.fadeIn(111);
			const formData = $(this).serializeArray();
			$_post.forEach((post) => {
				formData.push({
					name: post?.name,
					value: post?.value
				});
			});
			if (appIsDEV) console.log(`HTTP (${elementId}):${$returnType} to ${urlGet} `, formData);
			beforeFn(this);
			return $.ajax({
				...ajaxOpts,
				url: urlGet,
				type: $type,
				data: formData,
				dataType: $returnType
			})
				.then(function (response) {
					if (appIsDEV) console.log(`Response (${elementId}):`, response);
					if (loudFail && ![200, 201, 202].includes(response?.status))
						return show_modal_front("modal_front", "danger", "ERROR", "Ocurrió un error.<br>Disculpe las molestias, intente nuevamente.<br><code>(" + response?.message + ")</code>", true);
					doneFn(response?.data ?? response);
					return response?.data ?? response;
				})
				.catch(function (xhr, status, error) {
					console.error(`Error (${elementId}): ${xhr?.status} ${status} ${error} "${xhr?.responseJSON?.message ?? xhr?.responseText}"`, appIsDEV ? xhr : "");
					if (loudFail) show_modal_front("modal_front", "danger", "ERROR", "Ocurrió un error.<br>Disculpe las molestias, intente nuevamente.<br><code>(" + (xhr?.responseJSON?.message ?? xhr?.responseText) + ")</code>", true);
					failFn();
					return null;
				})
				.always(function (response) {
					submitBtn.removeAttr("disabled");
					spinner.fadeOut(111);
					alwaysFn(response?.data ?? response);
				});
		});
}
