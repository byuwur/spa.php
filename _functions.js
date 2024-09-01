"use strict";
/*
 * File: _functions.js
 * Desc: Contains common resources that are initialized in a per-page basis instead of globally.
 * Deps: jQuery
 * Copyright (c) 2024 Andrés Trujillo [Mateus] byUwUr
 */

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
 * @param {boolean} $delay Whether delays its detruction or not.
 */
function destroy_modal_front($delay = true) {
	$("#modal_front").modal("hide");
	setTimeout(() => $("#modal_front").remove(), $delay ? 111 : 1);
}

/**
 * Displays a Bootstrap modal with a customizable message and actions.
 * @param {string} $state The state of the modal (e.g., success, danger, info, warning).
 * @param {string} $title The title of the modal.
 * @param {string} $message The message to display in the modal.
 * @param {boolean} $hideCancelBtn Whether to hide the cancel button.
 * @param {string} $redirect The URL to redirect to when "OK" is clicked.
 */
function show_modal_front($state = "success", $title = "INFO.", $message = "Message.", $hideCancelBtn = false, $redirect = "javascript:destroy_modal_front();") {
	// If already exist, destroy it with no delay
	if ($("#modal_front").length) destroy_modal_front(false);
	// HTML structure for the modal
	let modal_front = `<div id="modal_front" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel">
        <div id="modal_front_container" class="modal-dialog modal-dialog-scrollable">
            <div class="modal-content">
                <div id="modal_front_title" class="modal-header m-0 fs-5 alert alert-${$state}">${$title}</div>
                <div id="modal_front_body" class="modal-body text-dark">${$message}</div>
                <div class="modal-footer">
                    <a id="modal_front_back" class="btn btn-dark" href="javascript:destroy_modal_front();" onclick="javascript:destroy_modal_front();">CANCEL</a>
                    <a id="modal_front_ok" class="btn btn-success" href="${$redirect}">OK</a>
                </div>
            </div>
        </div>
    </div>`;
	// Append it to the <body>
	$("body").append(modal_front);
	$hideCancelBtn ? $("#modal_front_back").addClass("d-none") : $("#modal_front_back").removeClass("d-none");
	// Center if window size merits and show
	window.innerWidth < 992 ? $("#modal_front_container").addClass("modal-dialog-centered") : $("#modal_front_container").removeClass("modal-dialog-centered");
	$("#modal_front").modal("show");
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
			if (loudFail && ![200, 201, 202].includes(response?.status)) return show_modal_front("danger", "ERROR", "Ocurrió un error.<br>Disculpe las molestias, intente nuevamente.<br><code>(" + response?.message + ")</code>", true);
			return response?.data;
		})
		.catch(function (xhr, status, error) {
			console.error(`Error (${elementId}): ${xhr?.status} ${status} ${error} "${xhr?.responseJSON?.message ?? xhr?.responseText}"`, appIsDEV ? xhr : "");
			if (loudFail) show_modal_front("danger", "ERROR", "Ocurrió un error.<br>Disculpe las molestias, intente nuevamente.<br><code>(" + (xhr?.responseJSON?.message ?? xhr?.responseText) + ")</code>", true);
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
					if (loudFail && ![200, 201, 202].includes(response?.status)) return show_modal_front("danger", "ERROR", "Ocurrió un error.<br>Disculpe las molestias, intente nuevamente.<br><code>(" + response?.message + ")</code>", true);
					doneFn(response?.data);
					return response?.data;
				})
				.catch(function (xhr, status, error) {
					console.error(`Error (${elementId}): ${xhr?.status} ${status} ${error} "${xhr?.responseJSON?.message ?? xhr?.responseText}"`, appIsDEV ? xhr : "");
					if (loudFail) show_modal_front("danger", "ERROR", "Ocurrió un error.<br>Disculpe las molestias, intente nuevamente.<br><code>(" + (xhr?.responseJSON?.message ?? xhr?.responseText) + ")</code>", true);
					failFn();
					return null;
				})
				.always(function () {
					submitBtn.removeAttr("disabled");
					spinner.fadeOut(111);
					alwaysFn();
				});
		});
}
