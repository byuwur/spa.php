"use strict";
/*
 * File: _transitions.js
 * Desc: Opt-in content transitions for selected page containers, without jQuery.
 * Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr
 */

/**
 * @typedef {Object} ByTransitionOptions
 * @property {number} [duration] Non-negative milliseconds; otherwise read --transition-duration on each target.
 * @property {string} [easing="ease"] CSS transition timing function accepted by CSS.supports().
 * @property {boolean} [children=false] Animate direct children too; watchers also observe descendant content changes.
 * @property {string} [exclude] CSS selector excluding matching elements and their descendants from effects.
 */

/**
 * @typedef {Object} ByTransitionWatcher
 * @property {function(): void} disconnect Stop observers, invalidate queued work, and cancel owned effects; safe to repeat.
 */

/**
 * Install the optional native-animation helper once per window.
 * Re-importing preserves active effects and watchers; nothing is observed until watch() is called.
 * @param {Window|Object} global Browser global receiving byTransition.
 * @returns {void}
 */
(function (global) {
  if (typeof global.byTransition === "function") return;

  // Cancel the previous animation before starting another on the same element.
  const active = new WeakMap();
  // Keep the normal height separate from the animated height.
  const watched = new WeakMap();

  // =================
  // ANIMATION TARGETS
  // =================
  /**
   * Check whether an element or its parent is excluded.
   * @private
   * @param {Element} element HTML element to check.
   * @param {ByTransitionOptions} options Transition options.
   * @returns {boolean} Whether the element is excluded.
   * @throws {DOMException} The exclusion selector is invalid CSS.
   */
  function excluded(element, options) {
    return Boolean(options.exclude && element.closest(options.exclude));
  }

  /**
   * Find matching elements, or return the supplied element.
   * @private
   * @param {string|Element} target CSS selector or HTML element.
   * @returns {Element[]} Matching elements.
   * @throws {TypeError} The target is neither a selector string nor an element.
   * @throws {DOMException} The selector is invalid CSS.
   */
  function elements(target) {
    if (typeof target === "string") return [...document.querySelectorAll(target)];
    if (target?.nodeType === 1) return [target];
    throw new TypeError("byTransition expects a CSS selector or element.");
  }

  /**
   * Read the element's computed CSS height.
   * @private
   * @param {Element} element HTML Element to measure.
   * @returns {number} Height in pixels, or 0 when the value is not numeric.
   */
  function height(element) {
    return Number.parseFloat(getComputedStyle(element).height) || 0;
  }

  // ===============
  // MOTION SETTINGS
  // ===============
  /**
   * Read and validate transition options.
   * @private
   * @param {Element} element HTML element providing --transition-duration.
   * @param {ByTransitionOptions} options Options overriding the CSS duration and default easing.
   * @returns {{duration: number, easing: string}} Duration in milliseconds and CSS easing.
   * @throws {RangeError} The effective duration is negative, non-numeric, or non-finite.
   * @throws {TypeError} Children, exclusion, or easing has an unsupported type/value.
   * @throws {DOMException} The exclusion selector is invalid CSS.
   */
  function settings(element, options) {
    const value = getComputedStyle(element).getPropertyValue("--transition-duration").trim() || "0.3s";
    const duration = options.duration ?? Number.parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);
    const easing = options.easing ?? "ease";
    if (options.children !== undefined && typeof options.children !== "boolean") throw new TypeError("Transition children must be a boolean.");
    if (options.exclude !== undefined && typeof options.exclude !== "string") throw new TypeError("Transition exclude must be a CSS selector.");
    if (options.exclude) element.matches(options.exclude);
    if (!Number.isFinite(duration) || duration < 0) throw new RangeError("Transition duration must be non-negative milliseconds.");
    if (typeof easing !== "string" || !CSS.supports("transition-timing-function", easing)) throw new TypeError("Invalid transition easing.");
    return { duration, easing };
  }

  // ==================
  // ELEMENT ANIMATIONS
  // ==================
  /**
   * Animate a container and optionally its direct children.
   * @private
   * @param {Element} element Updated HTML container.
   * @param {number} previousHeight Previous height in pixels.
   * @param {ByTransitionOptions} options Transition options.
   * @returns {Animation[]} Started animations. Hidden, excluded, and disabled targets are skipped.
   */
  function animateGroup(element, previousHeight, options) {
    const animations = [];
    const record = watched.get(element);
    const targets = options.children ? [element, ...element.children] : [element];
    for (const target of targets) {
      const animation = animate(target, target === element ? previousHeight : height(target), options);
      if (!animation) continue;
      animations.push(animation);
      if (record) {
        record.effects.set(target, animation);
        /** Remove the finished effect from this watcher. @returns {void} */
        const cleanup = () => {
          if (record.effects.get(target) === animation) record.effects.delete(target);
        };
        animation.addEventListener("finish", cleanup, { once: true });
        animation.addEventListener("cancel", cleanup, { once: true });
      }
    }
    return animations;
  }

  /**
   * Replace any running animation, starting from the current height and opacity.
   * @private
   * @param {Element} element HTML element to animate.
   * @param {number} previousHeight Height before the update, in pixels.
   * @param {ByTransitionOptions} options Transition options.
   * @returns {Animation|null} Animation, or null when the element cannot be animated.
   */
  function animate(element, previousHeight, options) {
    const previous = active.get(element);
    const startHeight = previous ? height(element) : previousHeight;
    const startOpacity = previous ? Number.parseFloat(getComputedStyle(element).opacity) : 0;
    // Read the current height and opacity before cancelling the previous animation.
    previous?.cancel();
    const endHeight = height(element);
    const record = watched.get(element);
    if (record) record.height = endHeight;
    const { duration, easing } = settings(element, options);
    if (!duration || !element.isConnected || !element.getClientRects().length || excluded(element, options) || document.documentElement.classList.contains("no-motion") || typeof element.animate !== "function") return null;

    const endOpacity = Number.parseFloat(getComputedStyle(element).opacity);
    // Set overflow in the keyframes so finishing or cancelling restores the original styles.
    const animation = element.animate(
      [
        { height: `${startHeight}px`, opacity: startOpacity, overflow: "hidden" },
        { height: `${endHeight}px`, opacity: endOpacity, overflow: "hidden" }
      ],
      { duration, easing }
    );
    /** Clear this animation's saved state after finish or cancellation. @returns {void} */
    const cleanup = () => {
      // Ignore finish/cancel events from an older animation.
      if (active.get(element)?.animation !== animation) return;
      active.delete(element);
      if (record) record.height = height(element);
    };
    active.set(element, {
      animation,
      /** Cancel the animation and clear its saved state. @returns {void} */
      cancel() {
        animation.cancel();
        cleanup();
      }
    });
    animation.addEventListener("finish", cleanup, { once: true });
    animation.addEventListener("cancel", cleanup, { once: true });
    return animation;
  }

  // ==============
  // TRANSITION API
  // ==============
  /**
   * Run a synchronous update once per matched container, then ease its height and opacity.
   * Updates still run with motion disabled or excluded. This helper neither clones nodes nor awaits promises.
   * A callback failure propagates without rolling back changes already made to this or earlier containers.
   * @param {string|Element} target Current document selector or existing container; no matches is a no-op.
   * @param {function(Element): void} update Synchronous DOM update receiving each matched container.
   * @param {ByTransitionOptions} [options={}] Timing, direct-child effects, and resource-owned exclusions.
   * @returns {Animation[]} Effects started immediately; watched containers queue effects instead and add no entries.
   * @throws {TypeError} The target, callback, or supported options are invalid.
   * @throws {RangeError} The effective duration is invalid.
   * @throws {DOMException} A target or exclusion selector is invalid CSS.
   */
  function byTransition(target, update, options = {}) {
    if (typeof update !== "function") throw new TypeError("byTransition expects a synchronous update callback.");
    const targets = elements(target);
    for (const element of targets) settings(element, options);
    const animations = [];
    for (const element of targets) {
      const previousHeight = height(element);
      const record = watched.get(element);
      if (record) record.nextOptions = options;
      try {
        update(element);
      } finally {
        // Use the watcher queue to avoid animating the same update twice.
        if (record) record.request();
      }
      if (!record) animations.push(...animateGroup(element, previousHeight, options));
    }
    return animations;
  }

  /**
   * Watch content changes in a fixed set of containers and coalesce each batch into one effect per container.
   * With children:false, observe the container's own child-list changes; children:true also observes its subtree.
   * Attributes remain ordinary CSS concerns. Excluded roots are skipped, and excluded mutation targets are ignored.
   * Explicit byTransition() calls on watched roots share this queue instead of starting a duplicate effect.
   * @param {string|Element} target Current document selector or existing container; later matches are not enrolled.
   * @param {ByTransitionOptions} [options={}] Same timing, exclusions, and direct-child effects as byTransition().
   * @returns {ByTransitionWatcher} Controller to disconnect before discarding roots or attaching another watcher.
   * @throws {Error} A selected, non-excluded root already has a watcher.
   * @throws {TypeError} The target or supported options are invalid.
   * @throws {RangeError} The effective duration is invalid.
   * @throws {DOMException} A target or exclusion selector is invalid CSS.
   */
  byTransition.watch = function (target, options = {}) {
    const targets = elements(target).filter((element) => !excluded(element, options));
    for (const element of targets) {
      if (watched.has(element)) throw new Error("This container already has a transition watcher.");
      settings(element, options);
    }
    const changed = new Set();
    let queued = false;
    let disconnected = false;
    /**
     * Queue one container for animation. Ignore calls after disconnect.
     * @private
     * @param {Element} element Watched HTML container.
     * @returns {void}
     */
    const request = (element) => {
      if (disconnected) return;
      changed.add(element);
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        if (disconnected) return;
        for (const target of changed) {
          const record = watched.get(target);
          animateGroup(target, record.height, { ...options, ...record.nextOptions });
          record.nextOptions = null;
        }
        changed.clear();
      });
    };
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const node = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
        if (!node || excluded(node, options)) continue;
        for (const element of targets) if (element.contains(node)) request(element);
      }
    });
    const resize =
      typeof ResizeObserver === "function"
        ? new ResizeObserver((entries) => {
            for (const { target: element } of entries) {
              const record = watched.get(element);
              // Only save the normal height while no animation is running.
              if (record && !active.has(element)) record.height = height(element);
            }
          })
        : null;
    for (const element of targets) {
      watched.set(element, {
        height: height(element),
        nextOptions: null,
        effects: new Map(),
        request: () => request(element)
      });
      observer.observe(element, {
        childList: true,
        characterData: true,
        subtree: options.children ?? false
      });
      resize?.observe(element);
    }
    return {
      /**
       * Stop watching, cancel active animations, and clear saved references.
       * Call before removing the containers. Repeated calls are safe.
       * @returns {void}
       */
      disconnect() {
        if (disconnected) return;
        disconnected = true;
        changed.clear();
        observer.disconnect();
        resize?.disconnect();
        for (const element of targets) {
          const record = watched.get(element);
          for (const target of record.effects.keys()) active.get(target)?.cancel();
          record.effects.clear();
          watched.delete(element);
        }
        targets.length = 0;
      }
    };
  };

  global.byTransition = byTransition;
})(typeof window !== "undefined" ? window : this);
