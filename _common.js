"use strict";
/*
 * File: _common.js
 * Desc: Contains common resources that are initialized in a per-page basis instead of globally.
 * Deps: jQuery, /_functions.js
 * Copyright (c) 2023 Andrés Trujillo [Mateus] byUwUr
 */

// Common selectors
const SIDEBAR_ID = "#sidebar",
	SIDERBAR_TOGGLE_ID = "#sidebar-toggle",
	SIDEBAR_HIDDEN_ID = "#sidebar-hidden",
	APP_CONTAINER_SELECTOR = ".app-container";

/**
 * Initializes the <Sidebar /> component in #spa-nav.
 */
function initSidebar() {
	// Check it exists in the first place. Duh..
	const jqSidebar = $(SIDEBAR_ID);
	if (!jqSidebar.length) return;
	console.log("Init <Sidebar />");
	if (!get_cookie("SidebarExpand")) set_cookie("SidebarExpand", "on");
	// Init the rest of the elements
	const jqSidebarToggle = $(SIDERBAR_TOGGLE_ID);
	const jqSidebarHidden = $(SIDEBAR_HIDDEN_ID);
	const jqAppContainer = $(APP_CONTAINER_SELECTOR);
	// Ensure the overlay inside the sidebar follows it accordingly, due to being an absolute positioned inside another
	jqSidebar
		.off("scroll")
		.on(
			"scroll",
			(function () {
				let sidebarScrollTop = 0;
				return debounce(function () {
					const top = Math.floor($(this).scrollTop()),
						diff = top - sidebarScrollTop;
					console.log(top);
					if (jqSidebar.hasClass("sidebar-expanded")) $(`${SIDEBAR_ID} .overlay`).css("height", `${$(`${SIDEBAR_ID} .overlay`).height() + diff}px`);
					sidebarScrollTop = top;
				});
			})()
		)
		// Ensure the sidebar collapses when the mouse leaves the sidebar itself
		.off("mouseleave")
		.on("mouseleave", function () {
			if (!jqSidebarToggle.hasClass("sidebar-expanded")) jqSidebar.removeClass("sidebar-expanded");
		});
	// Toggle sidebar expansion when the sidebar toggle button is clicked
	jqSidebarToggle.off("click").on("click", function () {
		jqSidebarToggle.trigger("blur");
		$("#sidebar .overlay").css("height", "");
		if (!jqSidebarToggle.hasClass("sidebar-expanded")) {
			jqSidebarToggle.addClass("sidebar-expanded");
			jqSidebar.addClass("sidebar-expanded");
			jqAppContainer.addClass("sidebar-expanded");
			jqSidebarHidden.css("display", "none");
			set_cookie("SidebarExpand", "on");
		} else {
			jqSidebarToggle.removeClass("sidebar-expanded");
			jqSidebar.removeClass("sidebar-expanded");
			jqAppContainer.removeClass("sidebar-expanded");
			jqSidebarHidden.css("display", "flex");
			jqSidebar.scrollTop(0);
			set_cookie("SidebarExpand", "off");
		}
	});
	// Expand sidebar when the hidden sidebar area is hovered
	jqSidebarHidden.off("mouseenter").on("mouseenter", function () {
		if (!jqSidebarToggle.hasClass("sidebar-expanded")) jqSidebar.addClass("sidebar-expanded");
	});
	// Collapse sidebar when the mouse leaves the hidden sidebar area
	jqSidebarHidden.off("mouseleave").on("mouseleave", function () {
		if (!jqSidebarToggle.hasClass("sidebar-expanded") && !jqSidebar.is(":hover")) jqSidebar.removeClass("sidebar-expanded");
	});
	// Expand the sidebar automatically on larger screens (min-width: 768px)
	if (window.matchMedia("(min-width: 768px)").matches && get_cookie("SidebarExpand") == "on") {
		jqSidebarToggle.addClass("sidebar-expanded");
		jqSidebar.addClass("sidebar-expanded");
		jqAppContainer.addClass("sidebar-expanded");
	}
}

/**
 * Some other initializations for common resources in the page.
 */
function initMisc() {
	// Smooth scroll for links with hashes in their href (excluding empty hashes)
	$("a[href*='#']:not([href='#'])")
		.off("click")
		.on("click", function (event) {
			event.preventDefault();
			// Scroll to the target element if it exists on the same page
			if ($(this.hash).length && location.pathname == this.pathname && location.hostname == this.hostname) $(`html, body, ${APP_CONTAINER_SELECTOR}`).animate({ scrollTop: $(this.hash).offset().top - 0 }, 999, "easeInOutExpo");
			// Collapse the navbar after clicking the link
			setTimeout(() => {
				$(".navbar-collapse").collapse("hide");
				if (window.matchMedia("(max-width: 768px)").matches && $(SIDERBAR_TOGGLE_ID).hasClass("sidebar-expanded")) {
					$(SIDERBAR_TOGGLE_ID).removeClass("sidebar-expanded");
					$(SIDEBAR_ID).removeClass("sidebar-expanded");
					$(APP_CONTAINER_SELECTOR).removeClass("sidebar-expanded");
					$(SIDEBAR_HIDDEN_ID).css("display", "flex");
					$(SIDEBAR_ID).scrollTop(0);
				}
			}, 333);
		});
}

/**
 * Initializes all Bootstrap components within the #spa-content.
 * It should be called whenever the content of the #spa-page-content-container changes dynamically to ensure that all components function correctly.
 */
function initBootstrapComponents() {
	if (typeof bootstrap === "undefined" && window.bootstrap === undefined) return console.warn("Can't reload bootstrap since it ain't present.");
	try {
		console.log("Init bootstrap");
		// Initialize Alert components
		[...document.querySelectorAll(".alert")].forEach((alertEl) => bootstrap.Alert.getInstance(alertEl) ?? new bootstrap.Alert(alertEl));
		// Initialize Carousel components
		[...document.querySelectorAll(".carousel")].forEach((carouselEl) => bootstrap.Carousel.getInstance(carouselEl) ?? new bootstrap.Carousel(carouselEl));
		// Initialize Collapse components
		[...document.querySelectorAll(".collapse")].forEach((collapseEl) => bootstrap.Collapse.getInstance(collapseEl) ?? new bootstrap.Collapse(collapseEl, { toggle: false }));
		// Initialize Dropdown components
		[...document.querySelectorAll(".dropdown-toggle")].forEach((dropdownEl) => bootstrap.Dropdown.getInstance(dropdownEl) ?? new bootstrap.Dropdown(dropdownEl));
		// Initialize Modal components
		[...document.querySelectorAll(".modal")].forEach((modalEl) => bootstrap.Modal.getInstance(modalEl) ?? new bootstrap.Modal(modalEl));
		// Initialize Offcanvas components
		[...document.querySelectorAll(".offcanvas")].forEach((offcanvasEl) => bootstrap.Offcanvas.getInstance(offcanvasEl) ?? new bootstrap.Offcanvas(offcanvasEl));
		// Initialize Tooltip components
		[...document.querySelectorAll("[data-bs-toggle='tooltip']")].forEach((tooltipEl) => bootstrap.Tooltip.getInstance(tooltipEl) ?? new bootstrap.Tooltip(tooltipEl, { animation: false }));
		// Initialize Popover components
		[...document.querySelectorAll("[data-bs-toggle='popover']")].forEach((popoverEl) => bootstrap.Popover.getInstance(popoverEl) ?? new bootstrap.Popover(popoverEl, { animation: false }));
		// Initialize ScrollSpy components
		[...document.querySelectorAll(".scrollspy")].forEach((scrollspyEl) => bootstrap.ScrollSpy.getInstance(scrollspyEl) ?? new bootstrap.ScrollSpy(scrollspyEl));
		// Initialize Tab components
		[...document.querySelectorAll(".nav-tabs .nav-link")].forEach((tabEl) => bootstrap.Tab.getInstance(tabEl) ?? new bootstrap.Tab(tabEl));
		// Initialize Toast components
		[...document.querySelectorAll(".toast")].forEach((toastEl) => bootstrap.Toast.getInstance(toastEl) ?? new bootstrap.Toast(toastEl));
		// Initialize Button components with aria-pressed synchronization
		[...document.querySelectorAll(".btn")].forEach((buttonEl) => {
			const buttonInstance = bootstrap.Tooltip.getInstance(buttonEl) ?? new bootstrap.Button(buttonEl);
			buttonEl.addEventListener("click", function () {
				buttonEl.setAttribute("aria-pressed", buttonInstance._element.classList.contains("active"));
			});
		});
		// Add more as needed, in case BS drops another class
	} catch (e) {
		console.warn("initBootstrapComponents():", e);
	}
}

/**
 * Reloads Google ReCaptcha if present
 */
function initReCaptcha() {
	// Check it exists in the first place. Duh..
	if (typeof grecaptcha === "undefined" && window.grecaptcha === undefined) return;
	try {
		console.log("Init g-reCaptcha");
		[...document.querySelectorAll(".g-recaptcha")].forEach((captchaEl) => (grecaptcha.render ? grecaptcha.render(captchaEl) : console.warn("grecaptcha not ready...")));
	} catch (e) {
		console.warn("initReCaptcha():", e);
	}
}

/**
 * Initializes all components that dynamically changes within the page
 */
function initCommon() {
	if (typeof jQuery === "undefined" && window.jQuery === undefined) return console.error("Init _common.js FAILED. No jQuery found.");
	console.log("Init _common.js");
	initSidebar();
	initBootstrapComponents();
	initReCaptcha();
	initMisc();
}
