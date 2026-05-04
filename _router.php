<?php
/* 
 * File: _router.php
 * Desc: Processes and routes incoming URIs based on predefined routes, handling URL parameters and errors. If a matching file is found, it serves the file with appropriate headers; otherwise, it prepares the environment for client-side routing.
 * Deps: /_var.php, "{$TO_HOME}/_functions.php", "{$TO_HOME}/_plugin.php"; $routes OR "{$TO_HOME}/_routes.php" MUST be previously defined/called.
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

// The rule must be previously configured in .htaccess or nginx.conf
// Initialize the URI from the GET parameter, defaulting to "/"
$uri = is_string($_GET["uri"] ?? null) ? $_GET["uri"] : "/";
// Ensure the URI starts with a "/" and doesn't end with one
if (!str_starts_with($uri, "/")) $uri = "/" . ltrim($uri, "/");
while (strlen($uri) > 1 && substr($uri, -1) == "/") $uri = substr($uri, 0, -1);
// Store the processed URI
$url = $uri;
// Handle URI parameters if present
if (strpos($uri, "/\$/") !== false) {
    list($uri, $params) = explode("/\$/", $uri, 2);
    $param_key_value = explode("/", $params);
    for ($i = 0; $i < count($param_key_value); $i += 2)
        if (isset($param_key_value[$i + 1]))
            $_GET[rawurldecode($param_key_value[$i])] = rawurldecode($param_key_value[$i + 1]);
}
// Check if the URI exists in the routes array; if not, return a 404 error
if (!array_key_exists($uri, $routes) || (!isset($routes[$uri]["URI"]) && !isset($routes[$uri]["FILE"])))
    error_crash(404, "Route \"{$uri}\" does not exist.");
// If the URI is associated with a file, serve the file with appropriate headers
if (array_key_exists($uri, $routes) && isset($routes[$uri]["FILE"])) {
    $file = $routes[$uri]["FILE"];
    $file_path = is_file($file) ? $file : (is_file("{$TO_HOME}{$file}") ? "{$TO_HOME}{$file}" : null);
    if (!$file_path) error_crash(404, "File route \"{$uri}\" does not exist.");
    header("Content-Type: " . get_mime_type($file_path));
    header("Content-Disposition: inline; filename=\"" . basename($file_path) . "\"");
    readfile($file_path);
    exit;
}
// Merge additional GET and POST parameters from the routes array
//$_GET = [...($routes[$uri]["GET"] ?? []), ...$_GET];
//$_POST = [...($routes[$uri]["POST"] ?? []), ...$_POST];
// It up to you who gets the priority tho...
$_GET = [...$_GET, ...$routes[$uri]["GET"] ?? []];
$_POST = [...$_POST, ...$routes[$uri]["POST"] ?? []];
?>
<script>
    // Store environment and routing information in localStorage for client-side use
    <?php if (($_ENV["APP_ENV"] ?? $NOTENV_APP_ENV) === "DEV") { ?>
        console.log("=== PHP ===", );
        console.log("APP_ENV", "<?= $_ENV["APP_ENV"] ?? $NOTENV_APP_ENV ?>");
        console.log("APP_VERSION", "<?= $_ENV["APP_VERSION"] ?? "0.1by" ?>");
        console.log("URI", "<?= $uri ?>");
        console.log("URL", "<?= $url ?>");
        console.log("ROUTES", JSON.stringify(<?= json_encode($routes) ?>));
        console.log("_GET", JSON.stringify(<?= json_encode($_GET) ?>));
        console.log("_POST", JSON.stringify(<?= json_encode($_POST) ?>));
        console.log("=== PHP ===", );
    <?php } ?>
    localStorage.setItem("APP_ENV", "<?= $_ENV["APP_ENV"] ?? $NOTENV_APP_ENV ?>");
    localStorage.setItem("APP_VERSION", "<?= $_ENV["APP_VERSION"] ?? "0.1by" ?>");
    localStorage.setItem("URI", "<?= $uri ?>");
    localStorage.setItem("URL", "<?= $url ?>");
    localStorage.setItem("ROUTES", JSON.stringify(<?= json_encode($routes) ?>));
    localStorage.setItem("_GET", JSON.stringify(<?= json_encode($_GET) ?>));
    localStorage.setItem("_POST", JSON.stringify(<?= json_encode($_POST) ?>));
</script>