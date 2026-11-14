"use strict";
/*
 * File: _load.js
 * Desc: Loads ordered CSS and classic JavaScript dependencies without jQuery.
 * Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr
 */

(function (global) {
  if (typeof global.byLoad === "function") return;

  const requests = new Map();
  const ready = document.readyState === "loading" ? new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true })) : null;

  /**
   * Load dependencies into the head, preserving their array order.
   * @param {Array<string|{path: string, attributes?: Object<string, string>, optional?: boolean}>} files CSS/JS paths or descriptors.
   * @param {Object} [options] Resolution options.
   * @param {string} [options.host=""] Prefix for paths beginning with /; ./ and ../ remain document-relative.
   * @param {boolean} [options.defer=true] Wait for DOM parsing; false starts the batch immediately.
   * @param {HTMLElement|null} [options.before=null] Head element before which assets are inserted, preserving the host's CSS cascade.
   * @returns {Promise<Array<HTMLElement|null>>} Loaded elements; optional failures warn and return null. Other failures reject. Failed requests can be retried.
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
