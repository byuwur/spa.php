<?php
/* 
 * File: _var.php
 * Desc: Initializes the system environment, sets up path-related variables, and optionally stores these values in the browser's localStorage. (MUST be included in every file)
 * Deps: none
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

// Initializes the output buffer and sets up paths and environment variables.
ob_start();
// Set the root directory of the system
$SYSTEM_ROOT = dirname(str_replace("\\", "/", __FILE__));
// Determine the protocol (HTTP or HTTPS)
$PROTOCOL = isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] == "on" ? "https://" : "http://";
// Calculate the difference in directory depth between the current script and the root directory
$PATH_DIFF = count(explode("/", str_replace("\\", "/", $_SERVER["SCRIPT_FILENAME"]))) - count(explode("/", str_replace("\\", "/", __FILE__)));
// Set the relative path to the home directory
$TO_HOME = $PATH_DIFF ? str_repeat("../", $PATH_DIFF) : "./";
// Get the current script's directory path
$THIS_PATH = str_replace("\\", "/", dirname($PROTOCOL . $_SERVER["HTTP_HOST"] . $_SERVER["PHP_SELF"]));
// Set the absolute path to the home directory
$HOME_PATH = $PATH_DIFF ? implode("/", array_slice(explode("/", $THIS_PATH), 0, -$PATH_DIFF)) : $THIS_PATH;
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
