<?php
/*
 * File: _config.php
 * Desc: Handles connections and exceptions: databases or services. 
 * Deps: /_var.php, $TO_HOME . "_functions.php", $TO_HOME . "_plugin.php";
 * Copyright (c) 2023 Andrés Trujillo [Mateus] byUwUr
 */

try {
    //$mysqli = new mysqli($_ENV["DB_HOST"], $_ENV["DB_USER"], $_ENV["DB_PASS"], $_ENV["DB_NAME"], $_ENV["DB_PORT"]);
} catch (Exception $e) {
    api_respond(500, true, "Connection failed" . ($_ENV["APP_ENV"] === "DEV" ? ": " . $e->getCode() . " = " . $e->getMessage() : ""));
}
