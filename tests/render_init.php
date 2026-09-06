<?php
// Render the actual application-owned bootstrap for JavaScript consumer tests.
if (PHP_SAPI !== "cli") {
  http_response_code(403);
  exit;
}
$_ENV = ["APP_ENV" => "PROD", "APP_URL" => $argv[2] ?? "https://example.test/app"];
$_SERVER = ["HTTP_HOST" => "example.test", "SCRIPT_FILENAME" => __FILE__, "PHP_SELF" => "/app/tests/render_init.php"];
$setLocalStorage = true;
require __DIR__ . (($argv[1] ?? "") === "demo" ? "/../demo/_init.php" : "/../_init.php");
