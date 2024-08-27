"use strict";
/*
 * File: common.js
 * Desc: Contains common resources that are initialized in a per-page basis instead of globally.
 * Deps: jQuery, /_functions.js
 * Copyright (c) 2023 Andrés Trujillo [Mateus] byUwUr
 */

// Check if jQuery is loaded before running the script
if (window.jQuery)
	$(() => {
		console.log("Init common.js");
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
		// Initialize Bootstrap tooltips
		[...document.querySelectorAll("[data-bs-toggle='tooltip']")].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl, { animation: false }));
		// Fix for Bootstrap navbar dropdowns by removing data-bs-popper attribute
		$(".dropdown-toggle")
			.off("click")
			.on("click", function () {
				$(".dropdown-menu").removeAttr("data-bs-popper");
			});
		// Expand the sidebar automatically on larger screens (min-width: 768px)
		if (window.matchMedia("(min-width: 768px)").matches) {
			$("#sidebar-toggle").addClass("sidebar-expanded");
			$("#sidebar").addClass("sidebar-expanded");
			$(".app-container").addClass("sidebar-expanded");
		}
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
				} else {
					$("#sidebar-toggle").removeClass("sidebar-expanded");
					$("#sidebar").removeClass("sidebar-expanded");
					$(".app-container").removeClass("sidebar-expanded");
					$("#sidebar-hidden").css("display", "flex");
					$("#sidebar").scrollTop(0);
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
		// Ensure the overlay inside the sidebar follows it accordingly, due to being an absolute positioned inside another
		let sidebarScrollTop = 0;
		$("#sidebar")
			.off("scroll")
			.on(
				"scroll",
				debounce(function () {
					const top = Math.floor($(this).scrollTop()),
						diff = top - sidebarScrollTop;
					console.log(top);
					if ($("#sidebar").hasClass("sidebar-expanded")) $("#sidebar .overlay").css("height", `${$("#sidebar .overlay").height() + diff}px`);
					sidebarScrollTop = top;
				})
			)
			// Ensure the sidebar collapses when the mouse leaves the sidebar itself
			.off("mouseleave")
			.on("mouseleave", function () {
				if (!$("#sidebar-toggle").hasClass("sidebar-expanded")) $("#sidebar").removeClass("sidebar-expanded");
			});
	});
