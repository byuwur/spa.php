<?php
/*
 * File: _config.php
 * Desc: Handles connections and exceptions: databases or services. 
 * Deps: /_var.php, "{$TO_HOME}/_functions.php", "{$TO_HOME}/_plugin.php";
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $mysqli = new mysqli($_ENV["DB_HOST"], $_ENV["DB_USER"], $_ENV["DB_PASS"], $_ENV["DB_NAME"], $_ENV["DB_PORT"]);
    $mysqli->set_charset("utf8mb4");
} catch (Throwable $e) {
    api_respond(500, true, "Connection failed" . (($_ENV["APP_ENV"] ?? "PROD") === "DEV" ? ": {$e->getCode()} = {$e->getMessage()}" : ""));
}
