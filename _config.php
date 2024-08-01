<?php
// MUST require_once "/_var.php", $TO_HOME . "_functions.php", $TO_HOME . "_plugin.php";
try {
    //$mysqli = new mysqli($_ENV["DB_HOST"], $_ENV["DB_USER"], $_ENV["DB_PASS"], $_ENV["DB_NAME"], $_ENV["DB_PORT"]);
} catch (Exception $e) {
    api_respond(500, true, "Connection failed" . ($_ENV["APP_ENV"] == "DEV" ? ": " . $e->getCode() . " = " . $e->getMessage() : ""));
}