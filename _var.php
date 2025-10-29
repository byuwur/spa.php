<?php
/* 
 * File: _var.php
 * Desc: Initializes the system environment, sets up path-related variables, and optionally stores these values in the browser's localStorage. (MUST be included in every file)
 * Deps: none
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

// Initializes the output buffer and sets up paths and environment variables.
ob_start();
$INVOKER__FILE__ = isset($INVOKER__FILE__) ? str_replace("\\", "/", $INVOKER__FILE__) : "";
#echo "INVOKER__FILE__: " . $INVOKER__FILE__ . "\n";
$INVOKER__DIR__ = isset($INVOKER__DIR__) ? str_replace("\\", "/", $INVOKER__DIR__) : "";
#echo "INVOKER__DIR__: " . $INVOKER__DIR__ . "\n";
$THIS__FILE__ = str_replace("\\", "/", __FILE__);
#echo "THIS__FILE__: " . $THIS__FILE__ . "\n";
$SERVER_SCRIPT_FILENAME = str_replace("\\", "/", $_SERVER["SCRIPT_FILENAME"]);
$SERVER_PHP_SELF = str_replace("\\", "/", $_SERVER["PHP_SELF"]);
$IS_PHP_ON_SERVER = php_sapi_name() != 'cli';
// Set the root directory of the system
$SYSTEM_ROOT = dirname($THIS__FILE__);
#echo "SYSTEM_ROOT: " . $SYSTEM_ROOT . "\n";
// Determine the protocol (HTTP or HTTPS)
$PROTOCOL = isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] == "on" ? "https://" : "http://";
#echo "PROTOCOL: " . $PROTOCOL . "\n";
// Calculate the difference in directory depth between the current script and the root directory
$PATH_DIFF = count(explode("/", ($IS_PHP_ON_SERVER ? $_SERVER["SCRIPT_FILENAME"] : $INVOKER__FILE__))) - count(explode("/", $THIS__FILE__));
#echo "PATH_DIFF: " . $PATH_DIFF . "\n";
// Set the relative path to the home directory
$TO_HOME = $PATH_DIFF > 0 ? substr(str_repeat("../", $PATH_DIFF), 0, -1) : ".";
#echo "TO_HOME: " . $TO_HOME . "\n";
// Get the current script's directory path
$THIS_PATH = $IS_PHP_ON_SERVER ? dirname($PROTOCOL . $_SERVER["HTTP_HOST"] . $SERVER_PHP_SELF) : dirname($INVOKER__FILE__);
#echo "THIS_PATH: " . $THIS_PATH . "\n";
// Set the absolute path to the home directory
$HOME_PATH = $PATH_DIFF > 0 ? implode("/", array_slice(explode("/", $THIS_PATH), 0, -$PATH_DIFF)) : $THIS_PATH;
#echo "HOME_PATH: " . $HOME_PATH . "\n";
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
