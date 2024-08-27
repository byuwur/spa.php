"use strict";
/*
 * File: _functions.js
 * Desc: Contains common resources that are initialized in a per-page basis instead of globally.
 * Deps: jQuery
 * Copyright (c) 2023 Andrés Trujillo [Mateus] byUwUr
 */

/**
 * Creates a debounced function that delays the execution of the provided function (`func`)
 * until after the specified `wait` time has elapsed since the last time the debounced function was called.
 *
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
