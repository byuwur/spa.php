"use strict";
/*
 * File: _load.js
 * Desc: Loads ordered CSS and classic JavaScript dependencies without jQuery.
 * Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr
 */

/**
 * @typedef {Object} ByLoadAsset
 * @property {string} path CSS/classic-JavaScript path or a supported CSS/JavaScript data URL.
 * @property {Object<string, string>} [attributes={}] Extra element attributes applied on the first request for a URL.
 * @property {boolean} [optional=false] Warn and return null for request failures; descriptor validation still rejects.
 */

/**
 * Install the loader once and reuse its saved requests on later imports.
 * Does not require jQuery or replace existing event handlers.
 * @param {Window|Object} global Browser global receiving byLoad.
 * @returns {void}
 */
(function (global) {
  if (typeof global.byLoad === "function") return;

  // Reuse loaded assets; remove failed requests so they can be retried.
  const requests = new Map();
  // Dynamic scripts do not delay DOMContentLoaded, even when their defer property is set.
  const ready = document.readyState === "loading" ? new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true })) : null;

  /**
   * Insert CSS and classic scripts into the head sequentially, awaiting each element's load event.
   * Required failures reject and stop this batch without removing earlier successful assets.
   * Duplicate URLs reuse the first request, including its attributes and insertion position.
   * Separate batches can overlap. Await this batch before using its assets.
   * @param {Array<string|ByLoadAsset>} files CSS/JS paths or descriptors, in loading order.
   * @param {Object} [options={}] Loading options.
   * @param {string} [options.host=""] Prefix for leading-slash paths; ./ and ../ resolve from document.baseURI.
   * @param {boolean} [options.defer=true] Wait for DOMContentLoaded; false begins loading during head parsing.
   * @param {Element|null} [options.before=null] Existing child of document.head before which each asset is inserted.
   * @returns {Promise<Array<HTMLLinkElement|HTMLScriptElement|null>>} Ordered loaded elements; optional request failures log and contribute null.
   * @throws {TypeError} Rejects for a non-array batch, empty path, unsupported asset/type, or invalid URL.
   * @throws {Error} Rejects for a required asset request or DOM insertion failure; a failed URL may be retried.
   */
  global.byLoad = async function (files, { host = "", before = null, defer = true } = {}) {
    if (!Array.isArray(files)) throw new TypeError("byLoad expects an array of CSS/JS paths.");
    if (defer && ready) await ready;
    const elements = [];
    for (const entry of files) {
      const { path, attributes = {}, optional = false } = typeof entry === "string" ? { path: entry } : entry || {};
      if (typeof path !== "string" || !path.trim()) throw new TypeError("Each dependency needs a non-empty path.");
      const url = new URL(host && path.startsWith("/") ? `${host.replace(/\/$/, "")}${path}` : path, document.baseURI);
      const stylesheet = /\.css$/i.test(url.pathname) || /^data:text\/css[;,]/i.test(url.href);
      const javascript = /\.js$/i.test(url.pathname) || /^data:(?:text|application)\/javascript[;,]/i.test(url.href);
      if (!stylesheet && !javascript) throw new TypeError(`Unsupported dependency: ${url.href}`);
      if (attributes.type && attributes.type !== "text/javascript" && attributes.type !== "text/css") throw new TypeError("byLoad supports classic scripts and stylesheets.");
      if (!requests.has(url.href)) {
        const request = new Promise((resolve, reject) => {
          const element = document.createElement(stylesheet ? "link" : "script");
          for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
          if (stylesheet) {
            element.rel = "stylesheet";
            element.href = url.href;
          } else {
            element.src = url.href;
            element.charset = "UTF-8";
            element.async = false;
            element.defer = defer;
          }
          // Loading a script does not confirm its initialization succeeded; fonts may still be loading.
          element.onload = () => {
            element.onload = element.onerror = null;
            resolve(element);
          };
          element.onerror = () => {
            element.onload = element.onerror = null;
            element.remove();
            reject(new Error(`Unable to load dependency: ${url.href}`));
          };
          document.head.insertBefore(element, before);
        }).catch((error) => {
          // Allow a later batch to retry this URL.
          requests.delete(url.href);
          throw error;
        });
        requests.set(url.href, request);
      }
      try {
        elements.push(await requests.get(url.href));
      } catch (error) {
        if (!optional) throw error;
        console.warn(error);
        elements.push(null);
      }
    }
    return elements;
  };
})(typeof window !== "undefined" ? window : this);
