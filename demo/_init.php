<?php
/* 
 * File: _init.php
 * Desc: Initializes the application-specific SPA environment, paths, storage, and runtime state. (MUST be included in every file)
 * Deps: none
 * Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr
 */

// --- functions ---

/**
 * Replaces "\\" directory separators to "/"
 * @param string $path String to convert
 * @return string Converted path
 */
function std_dir_separator(string $path): string
{
  return str_replace("\\", "/", $path);
}

/**
 * Returns whether the immediate client is an explicitly trusted proxy.
 * TRUST_PROXY must be enabled and REMOTE_ADDR must exactly match an address in TRUSTED_PROXIES.
 * @return bool Whether forwarded request metadata may be considered.
 */
function is_trusted_proxy(): bool
{
  if (!filter_var($_ENV["TRUST_PROXY"] ?? false, FILTER_VALIDATE_BOOLEAN))
    return false;
  $trusted = array_filter(array_map("trim", explode(",", $_ENV["TRUSTED_PROXIES"] ?? "")));
  return in_array($_SERVER["REMOTE_ADDR"] ?? "", $trusted, true);
}

/**
 * Returns the externally visible request scheme.
 * APP_URL has priority. Forwarded protocol is accepted only from a trusted proxy; otherwise direct HTTPS/server-port detection is used.
 * @return string "http" or "https".
 */
function public_scheme(): string
{
  $app_url = filter_var($_ENV["APP_URL"] ?? null, FILTER_VALIDATE_URL);
  if ($app_url)
    return strtolower(parse_url($app_url, PHP_URL_SCHEME) ?: "http");
  if (is_trusted_proxy()) {
    $forwarded = strtolower(trim(explode(",", $_SERVER["HTTP_X_FORWARDED_PROTO"] ?? "")[0]));
    if (in_array($forwarded, ["http", "https"], true))
      return $forwarded;
  }
  return ((!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") || ($_SERVER["SERVER_PORT"] ?? "") === "443") ? "https" : "http";
}

/**
 * Returns whether the public-facing request uses HTTPS.
 * @return bool Public HTTPS state used by secure session cookies.
 */
function is_public_https(): bool
{
  return public_scheme() === "https";
}

// Check if we're on localhost for DEVbugging
$NOTENV_APP_ENV = preg_match("/^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?$/", $_SERVER["HTTP_HOST"] ?? "") ? "DEV" : "PROD";
// Initializes the output buffer and sets up paths and environment variables.
ob_start();
$INVOKER__FILE__ = isset($INVOKER__FILE__) ? std_dir_separator($INVOKER__FILE__) : std_dir_separator(realpath($_SERVER["SCRIPT_FILENAME"] ?? "") ?: ($_SERVER["SCRIPT_FILENAME"] ?? ""));
if ($INVOKER__FILE__ && realpath($INVOKER__FILE__))
  $INVOKER__FILE__ = std_dir_separator(realpath($INVOKER__FILE__));
if (isset($debug) && $debug)
  echo "INVOKER__FILE__: " . $INVOKER__FILE__ . " <br>\n";
$INVOKER__DIR__ = isset($INVOKER__DIR__) ? std_dir_separator($INVOKER__DIR__) : dirname($INVOKER__FILE__);
if (isset($debug) && $debug)
  echo "INVOKER__DIR__: " . $INVOKER__DIR__ . " <br>\n";
$THIS__FILE__ = std_dir_separator(__FILE__);
if (isset($debug) && $debug)
  echo "THIS__FILE__: " . $THIS__FILE__ . " <br>\n";
$SERVER_SCRIPT_FILENAME = std_dir_separator($_SERVER["SCRIPT_FILENAME"] ?? $INVOKER__FILE__);
$SERVER_PHP_SELF = std_dir_separator($_SERVER["PHP_SELF"] ?? $INVOKER__FILE__);
$IS_PHP_ON_SERVER = isset($IS_PHP_ON_SERVER) ? $IS_PHP_ON_SERVER : php_sapi_name() != 'cli';
// Set the root directory of the system
$SYSTEM_ROOT = dirname($THIS__FILE__);
if (isset($debug) && $debug)
  echo "SYSTEM_ROOT: " . $SYSTEM_ROOT . " <br>\n";
// Determine the protocol (HTTP or HTTPS)
$PROTOCOL = public_scheme() . "://";
if (isset($debug) && $debug)
  echo "PROTOCOL: " . $PROTOCOL . " <br>\n";
// Calculate the difference in directory depth between the current script and the root directory
$PATH_DIFF = count(explode("/", ($IS_PHP_ON_SERVER ? $SERVER_SCRIPT_FILENAME : $INVOKER__FILE__))) - count(explode("/", $THIS__FILE__));
if (isset($debug) && $debug)
  echo "PATH_DIFF: " . $PATH_DIFF . " <br>\n";
// Set the relative path to the home directory
$TO_HOME = $PATH_DIFF > 0 ? substr(str_repeat("../", $PATH_DIFF), 0, -1) : ".";
if (isset($debug) && $debug)
  echo "TO_HOME: " . $TO_HOME . " <br>\n";
// Get the current script's directory path
$public_host = $_SERVER["HTTP_HOST"] ?? "localhost";
// Forwarded hosts are user-controlled unless the immediate proxy is trusted.
if (is_trusted_proxy()) {
  $forwarded_host = trim(explode(",", $_SERVER["HTTP_X_FORWARDED_HOST"] ?? "")[0]);
  if (preg_match("/^[a-z0-9.-]+(?::\d+)?$/i", $forwarded_host))
    $public_host = $forwarded_host;
}
$THIS_PATH = $IS_PHP_ON_SERVER ? dirname($PROTOCOL . $public_host . $SERVER_PHP_SELF) : dirname($INVOKER__FILE__);
if (isset($debug) && $debug)
  echo "THIS_PATH: " . $THIS_PATH . " <br>\n";
// Set the absolute path to the home directory
$HOME_PATH = $PATH_DIFF > 0 ? implode("/", array_slice(explode("/", $THIS_PATH), 0, -$PATH_DIFF)) : $THIS_PATH;
$configured_app_url = filter_var($_ENV["APP_URL"] ?? null, FILTER_VALIDATE_URL);
if ($configured_app_url)
  $HOME_PATH = rtrim($configured_app_url, "/");
if (isset($debug) && $debug)
  echo "HOME_PATH: " . $HOME_PATH . " <br>\n";
// _storaje.js code only exists in first invokation
$json_script_flags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE;
if (isset($setLocalStorage) && $setLocalStorage) { ?>
  <script>
    "use strict";
    /*
     * File: _storage.js
     * Desc: Manages the Single Page Application (SPA) storage.
     * Deps: none
     * Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr
     */

    /**
     * Provides namespaced SPA storage with an in-memory fallback.
     * Legacy unprefixed keys are migrated on first read.
     * @namespace byStorage
     */
    (function (global) {
      global.byStorage = global.byStorage || {};
      const byStorage = global.byStorage;
      byStorage.memory = {};
      byStorage.base = new URL(<?= json_encode(rtrim($HOME_PATH, "/") . "/", $json_script_flags) ?>, document.baseURI).pathname.replace(/\/$/, "") || "/";
      byStorage.prefix = `bySPA:${byStorage.base}:`;

      /**
       * Gets a stored value, migrating a legacy key when needed.
       * @param {string} key
       * @returns {string|null}
       */
      byStorage.getItem = function (key) {
        try {
          const value = global.localStorage.getItem(byStorage.prefix + key);
          if (value !== null) return value;
          // Migrate legacy unprefixed storage.
          const legacy = global.localStorage.getItem(key);
          if (legacy !== null) {
            byStorage.memory[key] = legacy;
            global.localStorage.setItem(byStorage.prefix + key, legacy);
            // Remove the old key only after storage confirms the migrated value.
            if (global.localStorage.getItem(byStorage.prefix + key) === legacy)
              try {
                global.localStorage.removeItem(key);
              } catch (_) { }
          }
          return legacy;
        } catch (_) {
          return Object.prototype.hasOwnProperty.call(byStorage.memory, key) ? byStorage.memory[key] : null;
        }
      };

      /**
       * Stores a value using the SPA namespace.
       * @param {string} key
       * @param {*} value
       * @returns {void}
       */
      byStorage.setItem = function (key, value) {
        byStorage.memory[key] = String(value);
        try {
          global.localStorage.setItem(byStorage.prefix + key, value);
        } catch (_) { }
      };

      /**
       * Removes a stored value.
       * @param {string} key
       * @returns {void}
       */
      byStorage.removeItem = function (key) {
        delete byStorage.memory[key];
        try {
          global.localStorage.removeItem(byStorage.prefix + key);
        } catch (_) { }
      };
    })(typeof window !== "undefined" ? window : this);
  </script>
  <script>
    // Store the calculated paths in the browser's localStorage
    <?php if (($_ENV["APP_ENV"] ?? $NOTENV_APP_ENV) === "DEV") { ?>
      console.log("PROTOCOL", <?= json_encode($PROTOCOL, $json_script_flags) ?>);
      console.log("PATH_DIFF", <?= json_encode($PATH_DIFF, $json_script_flags) ?>);
      console.log("TO_HOME", <?= json_encode($TO_HOME, $json_script_flags) ?>);
      console.log("THIS_PATH", <?= json_encode($THIS_PATH, $json_script_flags) ?>);
      console.log("HOME_PATH", <?= json_encode($HOME_PATH, $json_script_flags) ?>);
    <?php } ?>
    byStorage.setItem("PROTOCOL", <?= json_encode($PROTOCOL, $json_script_flags) ?>);
    byStorage.setItem("PATH_DIFF", <?= json_encode((string) $PATH_DIFF) ?>);
    byStorage.setItem("TO_HOME", <?= json_encode($TO_HOME, $json_script_flags) ?>);
    byStorage.setItem("THIS_PATH", <?= json_encode($THIS_PATH, $json_script_flags) ?>);
    byStorage.setItem("HOME_PATH", <?= json_encode($HOME_PATH, $json_script_flags) ?>);
  </script>
<?php }
