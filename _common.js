"use strict";
/*
 * File: _common.js
 * Desc: Contains common resources that are initialized in a per-page basis instead of globally.
 * Deps: jQuery, /_functions.js
 * Copyright (c) 2023 Andrés Trujillo [Mateus] byUwUr
 */

/**
 * Initializes all Bootstrap components within the #spa-content.
 * It should be called whenever the content of the #spa-page-content-container changes dynamically to ensure that all components function correctly.
 */
function initBootstrapComponents() {
	if (typeof bootstrap === "undefined" && window.bootstrap === undefined) return console.warn("Can't reload bootstrap since it ain't present.");
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
}

/**
 * Initializes the <Sidebar /> component in #spa-nav.
 */
function initSidebar() {
	// Check it exists in the first place. Duh..
	if (!$("#sidebar").length) return;
	console.log("Init <Sidebar />");
	if (!get_cookie("SidebarExpand")) set_cookie("SidebarExpand", "on");
	// Ensure the overlay inside the sidebar follows it accordingly, due to being an absolute positioned inside another
	$("#sidebar")
		.off("scroll")
		.on(
			"scroll",
			(function () {
				let sidebarScrollTop = 0;
				return debounce(function () {
					const top = Math.floor($(this).scrollTop()),
						diff = top - sidebarScrollTop;
					console.log(top);
					if ($("#sidebar").hasClass("sidebar-expanded")) $("#sidebar .overlay").css("height", `${$("#sidebar .overlay").height() + diff}px`);
					sidebarScrollTop = top;
				});
			})()
		)
		// Ensure the sidebar collapses when the mouse leaves the sidebar itself
		.off("mouseleave")
		.on("mouseleave", function () {
			if (!$("#sidebar-toggle").hasClass("sidebar-expanded")) $("#sidebar").removeClass("sidebar-expanded");
		});
	// Toggle sidebar expansion when the sidebar toggle button is clicked
	$("#sidebar-toggle")
		.off("click")
		.on("click", function () {
			$("#sidebar-toggle").trigger("blur");
			$("#sidebar .overlay").css("height", "");
			if (!$("#sidebar-toggle").hasClass("sidebar-expanded")) {
				$("#sidebar-toggle").addClass("sidebar-expanded");
				$("#sidebar").addClass("sidebar-expanded");
				$(".app-container").addClass("sidebar-expanded");
				$("#sidebar-hidden").css("display", "none");
				set_cookie("SidebarExpand", "on");
			} else {
				$("#sidebar-toggle").removeClass("sidebar-expanded");
				$("#sidebar").removeClass("sidebar-expanded");
				$(".app-container").removeClass("sidebar-expanded");
				$("#sidebar-hidden").css("display", "flex");
				$("#sidebar").scrollTop(0);
				set_cookie("SidebarExpand", "off");
			}
		});
	// Expand sidebar when the hidden sidebar area is hovered
	$("#sidebar-hidden")
		.off("mouseenter")
		.on("mouseenter", function () {
			if (!$("#sidebar-toggle").hasClass("sidebar-expanded")) $("#sidebar").addClass("sidebar-expanded");
		});
	// Collapse sidebar when the mouse leaves the hidden sidebar area
	$("#sidebar-hidden")
		.off("mouseleave")
		.on("mouseleave", function () {
			if (!$("#sidebar-toggle").hasClass("sidebar-expanded") && !$("#sidebar").is(":hover")) $("#sidebar").removeClass("sidebar-expanded");
		});
	// Expand the sidebar automatically on larger screens (min-width: 768px)
	if (window.matchMedia("(min-width: 768px)").matches && get_cookie("SidebarExpand") == "on") {
		$("#sidebar-toggle").addClass("sidebar-expanded");
		$("#sidebar").addClass("sidebar-expanded");
		$(".app-container").addClass("sidebar-expanded");
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
			if ($(this.hash).length && location.pathname == this.pathname && location.hostname == this.hostname) {
				$("html, body").animate({ scrollTop: $(this.hash).offset().top - 120 }, 999, "easeInOutExpo");
			}
			// Collapse the navbar after clicking the link
			setTimeout(() => $(".navbar-collapse").collapse("hide"), 333);
		});
}

/**
 * Reloads Google ReCaptcha if present
 */
function initReCaptcha() {
	// Check it exists in the first place. Duh..
	if (typeof grecaptcha === "undefined" && window.grecaptcha === undefined) return;
	console.log("Init g-reCaptcha");
	[...document.querySelectorAll(".g-recaptcha")].forEach((captchaEl) => (grecaptcha.render ? grecaptcha.render(captchaEl) : console.warn("grecaptcha not ready...")));
}

/**
 * Initializes all components that dynamically changes within the page
 */
function initCommon() {
	if (typeof jQuery === "undefined" && window.jQuery === undefined) return console.error("Init _common.js FAILED. No jQuery found.");
	console.log("Init _common.js");
	initBootstrapComponents();
	initSidebar();
	initMisc();
	initReCaptcha();
}
