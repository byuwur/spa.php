"use strict";
/*
 * File: _common.js
 * Desc: Contains common resources and functions that are initialized in a per-page basis instead of globally and can be used project-wide.
 * Deps: jQuery, /_functions.js
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

/**
 * Initializes global object and assigns its properties.
 * This IIFE (Immediately Invoked Function Expression) ensures byCommon object exists globally
 * (typically on `window` in a browser) to avoid pollution and conflicts in the global namespace.
 * @param {Object} global - The global object, usually `window` in a browser.
 */
(function (global) {
	global.byCommon = global.byCommon || {};
	const byCommon = global.byCommon;
	// Common selectors
	byCommon.SIDEBAR_ID = "#bywr-sidebar";
	byCommon.SIDERBAR_TOGGLE_ID = "#bywr-sidebar-toggle";
	byCommon.SIDEBAR_HIDDEN_ID = "#bywr-sidebar-hidden";
	byCommon.APP_CONTAINER_SELECTOR = ".app-container";

	/**
	 * Initializes the <Sidebar /> component in #spa-nav.
	 */
	byCommon.initSidebar = function () {
		// Check it exists in the first place. Duh..
		const jqSidebar = $(byCommon.SIDEBAR_ID);
		if (!jqSidebar.length) return console.warn("Can't load Sidebar if element ain't present.");
		console.log("Init <Sidebar />");
		if (!get_cookie("SidebarExpand")) set_cookie("SidebarExpand", "on");
		// Init the rest of the elements
		const jqSidebarToggle = $(byCommon.SIDERBAR_TOGGLE_ID);
		if (!jqSidebarToggle.length) console.warn(`Can't load Sidebar Element: "jqSidebarToggle". It doesn't exist.`);
		const jqSidebarHidden = $(byCommon.SIDEBAR_HIDDEN_ID);
		if (!jqSidebarHidden.length) console.warn(`Can't load Sidebar Element: "jqSidebarHidden". It doesn't exist.`);
		const jqAppContainer = $(byCommon.APP_CONTAINER_SELECTOR);
		if (!jqAppContainer.length) console.warn(`Can't load Sidebar Element: "jqAppContainer". It doesn't exist.`);
		// Ensure the overlay inside the sidebar follows it accordingly, due to being an absolute positioned inside another
		jqSidebar
			.off("scroll")
			.on("scroll", function () {
				const overlay = $(this).find(".overlay");
				if ($(overlay).length) $(overlay).height(`${this.scrollHeight}px`);
			})
			// Ensure the sidebar collapses when the mouse leaves the sidebar itself
			.off("mouseleave")
			.on("mouseleave", function () {
				if (!jqSidebarToggle.hasClass("bywr-sidebar-expanded")) jqSidebar.removeClass("bywr-sidebar-expanded");
			});
		// Toggle sidebar expansion when the sidebar toggle button is clicked
		jqSidebarToggle.off("click").on("click", function () {
			jqSidebarToggle.trigger("blur");
			$("#bywr-sidebar .overlay").css("height", "");
			if (!jqSidebarToggle.hasClass("bywr-sidebar-expanded")) {
				jqSidebarToggle.addClass("bywr-sidebar-expanded");
				jqSidebar.addClass("bywr-sidebar-expanded");
				jqAppContainer.addClass("bywr-sidebar-expanded");
				set_cookie("SidebarExpand", "on");
			} else {
				jqSidebarToggle.removeClass("bywr-sidebar-expanded");
				jqSidebar.removeClass("bywr-sidebar-expanded");
				jqAppContainer.removeClass("bywr-sidebar-expanded");
				jqSidebar.scrollTop(0);
				set_cookie("SidebarExpand", "off");
			}
		});
		// Expand sidebar when the hidden sidebar area is hovered
		jqSidebarHidden.off("mouseenter").on("mouseenter", function () {
			$("#bywr-sidebar .overlay").css("height", "");
			if (!jqSidebarToggle.hasClass("bywr-sidebar-expanded")) jqSidebar.addClass("bywr-sidebar-expanded");
		});
		// Collapse sidebar when the mouse leaves the hidden sidebar area
		jqSidebarHidden.off("mouseleave").on("mouseleave", function () {
			$("#bywr-sidebar .overlay").css("height", "");
			if (!jqSidebarToggle.hasClass("bywr-sidebar-expanded") && !jqSidebar.is(":hover")) jqSidebar.removeClass("bywr-sidebar-expanded");
		});
		// Expand the sidebar automatically on larger screens (min-width: 768px)
		if (window.innerWidth > 768 && get_cookie("SidebarExpand") == "on") {
			jqSidebarToggle.addClass("bywr-sidebar-expanded");
			jqSidebar.addClass("bywr-sidebar-expanded");
			jqAppContainer.addClass("bywr-sidebar-expanded");
		}
	};

	/**
	 * Some other initializations for common resources in the page.
	 */
	byCommon.initMisc = function () {
		// Smooth scroll for links with hashes in their href (excluding empty hashes)
		$("a[href*='#']:not([href='#'])")
			.off("click")
			.on("click", function (event) {
				event.preventDefault();
				// Scroll to the target element if it exists on the same page
				if ($(this.hash).length)
					$(`html, body, ${byCommon.APP_CONTAINER_SELECTOR}`)
						.stop()
						.animate({ scrollTop: $(this.hash).offset().top - 120 }, 999, "easeInOutExpo");
				// Collapse the navbar after clicking the link
				setTimeout(() => {
					$(".navbar-collapse").collapse("hide");
					if (window.innerWidth < 768 && $(byCommon.SIDERBAR_TOGGLE_ID).hasClass("bywr-sidebar-expanded")) {
						$(byCommon.SIDERBAR_TOGGLE_ID).removeClass("bywr-sidebar-expanded");
						$(byCommon.SIDEBAR_ID).removeClass("bywr-sidebar-expanded");
						$(byCommon.APP_CONTAINER_SELECTOR).removeClass("bywr-sidebar-expanded");
						$(byCommon.SIDEBAR_ID).scrollTop(0);
					}
				}, 333);
			});
		if (window.cookieconsent)
			window.cookieconsent.run({
				notice_banner_type: "simple",
				consent_type: "express",
				palette: localStorage.getItem("APP_THEME") ?? "dark",
				language: localStorage.getItem("APP_LANG") ?? "es",
				website_name: "[Mateus] byUwUr",
				change_preferences_selector: "#cookiePrefs"
			});
		else console.warn("Can't load cookieconsent if script ain't exist.");
		console.log("Init misc");
	};

	/**
	 * Initializes all Bootstrap components within the #spa-content.
	 * It should be called whenever the content of the #spa-page-content-container changes dynamically to ensure that all components function correctly.
	 */
	byCommon.initBootstrap = function () {
		if (typeof bootstrap === "undefined" && window.bootstrap === undefined) return console.warn("Can't load Bootstrap if script ain't present.");
		try {
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
			console.log("Init bootstrap");
		} catch (e) {
			console.warn("initBootstrap():", e);
		}
	};

	/**
	 * Reloads Google ReCaptcha if present
	 */
	byCommon.initCaptcha = function () {
		// Check it exists in the first place. Duh..
		if (typeof grecaptcha === "undefined" && window.grecaptcha === undefined) return console.warn("Can't load reCaptcha if script ain't present.");
		try {
			[...document.querySelectorAll(".g-recaptcha")].forEach((captchaEl) => (grecaptcha.render ? grecaptcha.render(captchaEl) : console.warn("grecaptcha not ready...")));
			console.log("Init captcha");
		} catch (e) {
			console.warn("initCaptcha():", e);
		}
	};

	/**
	 * Initializes all components that dynamically changes within the page
	 */
	byCommon.init = function () {
		if (typeof jQuery === "undefined" && window.jQuery === undefined) return console.error("Init _common.js FAILED. No jQuery found.");
		$(() => {
			console.log("Init _common.js");
			byCommon.initCaptcha();
			byCommon.initMisc();
			byCommon.initBootstrap();
			byCommon.initSidebar();
		});
	};

	// --- ACCESSIBILITY ---

	/**
	 * Accessibility: Toggle
	 */
	byCommon.fontSize = 16;
	byCommon.accessibilityElement = $("html");
	/**
	 * Accessibility: Toggle
	 */
	byCommon.accessibilityToggle = function () {
		$("#bywr-accessibility-buttons").toggleClass("hide");
	};
	/**
	 * Accessibility: Text Size
	 */
	byCommon.accessibilityText = function (mode = "") {
		switch (mode) {
			case "plus":
				if (byCommon.fontSize <= 80) byCommon.fontSize += 2;
				break;
			case "minus":
				if (byCommon.fontSize >= 8) byCommon.fontSize -= 2;
				break;
			default:
				byCommon.fontSize = 16;
				break;
		}
		byCommon.accessibilityElement.css("font-size", `${byCommon.fontSize}px`);
		$("body").css("font-size", `${byCommon.fontSize}px`);
	};
	/**
	 * Accessibility: No Motion
	 */
	byCommon.accessibilityMotion = function () {
		byCommon.accessibilityElement.toggleClass("no-motion");
	};
	/**
	 * Accessibility: Dyslexia
	 */
	byCommon.accessibilityDyslexia = function () {
		//byCommon.accessibilityElement.toggleClass("dyslexia");
		$("body").toggleClass("dyslexia");
	};
	/**
	 * Accessibility: Word spacing
	 */
	byCommon.accessibilityWordSpacing = function () {
		//byCommon.accessibilityElement.toggleClass("word-spacing");
		$("body").toggleClass("word-spacing");
	};
	/**
	 * Accessibility: Highlight Links
	 */
	byCommon.accessibilityHighlightLinks = function () {
		byCommon.accessibilityElement.toggleClass("highlight-links");
	};
	/**
	 * Accessibility: High contrast
	 */
	byCommon.accessibilityHighContrast = function (mode = "high-contrast") {
		if (byCommon.accessibilityElement.hasClass(mode)) {
			byCommon.accessibilityElement.removeClass(mode);
			return;
		}
		byCommon.accessibilityElement.removeClass("protanopia");
		byCommon.accessibilityElement.removeClass("deuteranopia");
		byCommon.accessibilityElement.removeClass("tritanopia");
		byCommon.accessibilityElement.removeClass("monochropia");
		byCommon.accessibilityElement.removeClass("invertchropia");
		byCommon.accessibilityElement.removeClass("high-contrast");
		byCommon.accessibilityElement.addClass(mode);
	};
})(typeof window !== "undefined" ? window : this);
