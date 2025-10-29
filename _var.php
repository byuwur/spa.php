<?php
/* 
 * File: _var.php
 * Desc: Initializes the system environment, sets up path-related variables, and optionally stores these values in the browser's localStorage. (MUST be included in every file)
 * Deps: none
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
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

// Initializes the output buffer and sets up paths and environment variables.
ob_start();
$INVOKER__FILE__ = isset($INVOKER__FILE__) ? std_dir_separator($INVOKER__FILE__) : "";
if (isset($debug) && $debug) echo "INVOKER__FILE__: " . $INVOKER__FILE__ . " <br>\n";
$INVOKER__DIR__ = isset($INVOKER__DIR__) ? std_dir_separator($INVOKER__DIR__) : "";
if (isset($debug) && $debug) echo "INVOKER__DIR__: " . $INVOKER__DIR__ . " <br>\n";
$THIS__FILE__ = std_dir_separator(__FILE__);
if (isset($debug) && $debug) echo "THIS__FILE__: " . $THIS__FILE__ . " <br>\n";
$SERVER_SCRIPT_FILENAME = std_dir_separator($_SERVER["SCRIPT_FILENAME"]);
$SERVER_PHP_SELF = std_dir_separator($_SERVER["PHP_SELF"]);
$IS_PHP_ON_SERVER = isset($IS_PHP_ON_SERVER) ? $IS_PHP_ON_SERVER : php_sapi_name() != 'cli';
// Set the root directory of the system
$SYSTEM_ROOT = dirname($THIS__FILE__);
if (isset($debug) && $debug) echo "SYSTEM_ROOT: " . $SYSTEM_ROOT . " <br>\n";
// Determine the protocol (HTTP or HTTPS)
$PROTOCOL = isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] == "on" ? "https://" : "http://";
if (isset($debug) && $debug) echo "PROTOCOL: " . $PROTOCOL . " <br>\n";
// Calculate the difference in directory depth between the current script and the root directory
$PATH_DIFF = count(explode("/", ($IS_PHP_ON_SERVER ? $_SERVER["SCRIPT_FILENAME"] : $INVOKER__FILE__))) - count(explode("/", $THIS__FILE__));
if (isset($debug) && $debug) echo "PATH_DIFF: " . $PATH_DIFF . " <br>\n";
// Set the relative path to the home directory
$TO_HOME = $PATH_DIFF > 0 ? substr(str_repeat("../", $PATH_DIFF), 0, -1) : ".";
if (isset($debug) && $debug) echo "TO_HOME: " . $TO_HOME . " <br>\n";
// Get the current script's directory path
$THIS_PATH = $IS_PHP_ON_SERVER ? dirname($PROTOCOL . $_SERVER["HTTP_HOST"] . $SERVER_PHP_SELF) : dirname($INVOKER__FILE__);
if (isset($debug) && $debug) echo "THIS_PATH: " . $THIS_PATH . " <br>\n";
// Set the absolute path to the home directory
$HOME_PATH = $PATH_DIFF > 0 ? implode("/", array_slice(explode("/", $THIS_PATH), 0, -$PATH_DIFF)) : $THIS_PATH;
if (isset($debug) && $debug) echo "HOME_PATH: " . $HOME_PATH . " <br>\n";
// Store the calculated paths in the browser's localStorage
if (isset($setLocalStorage) && $setLocalStorage) { ?>
    <script>
        localStorage.setItem("PROTOCOL", "<?= $PROTOCOL ?>");
        localStorage.setItem("PATH_DIFF", "<?= $PATH_DIFF ?>");
        localStorage.setItem("TO_HOME", "<?= $TO_HOME ?>");
        localStorage.setItem("THIS_PATH", "<?= $THIS_PATH ?>");
        localStorage.setItem("HOME_PATH", "<?= $HOME_PATH ?>");
    </script>
<?php }
