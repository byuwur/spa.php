<?php
/* 
 * File: _router.php
 * Desc: Processes and routes incoming URIs based on predefined routes, handling URL parameters and errors. If a matching file is found, it serves the file with appropriate headers; otherwise, it prepares the environment for client-side routing.
 * Deps: $TO_HOME . "_functions.php", $TO_HOME . "_plugin.php"; $routes OR $TO_HOME . "_routes.php" MUST be previously defined/called.
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

// The rule must be previously configured in .htaccess or nginx.conf
// Initialize the URI from the GET parameter, defaulting to "/"
$uri = $_GET["uri"] ?? "/";
// Ensure the URI starts with a "/" and doesn't end with one
while (strlen($uri) > 0 && substr($uri, 0, 1) != "/") $uri = substr($uri, 1);
while (strlen($uri) > 1 && substr($uri, -1) == "/") $uri = substr($uri, 0, -1);
// Store the processed URI
$url = $uri;
// Handle URI parameters if present
if (strpos($uri, "/\$/") !== false) {
    list($uri, $params) = explode("/\$/", $uri, 2);
    $param_key_value = explode("/", $params);
    for ($i = 0; $i < count($param_key_value); $i += 2)
        if (isset($param_key_value[$i + 1]))
            $_GET[$param_key_value[$i]] = $param_key_value[$i + 1];
}
// Check if the URI exists in the routes array; if not, return a 404 error
if (!array_key_exists($uri, $routes) || empty($routes) || (!isset($routes[$uri]["URI"]) && !isset($routes[$uri]["FILE"])))
    error_crash(404, "Route \"" . $uri . "\" does not exist.", "_error.php");
// If the URI is associated with a file, serve the file with appropriate headers
if (array_key_exists($uri, $routes) && isset($routes[$uri]["FILE"])) {
    header("Content-Type: " . get_mime_type($routes[$uri]["FILE"]));
    header("Content-Disposition: inline; filename=\"" . basename($routes[$uri]["FILE"]) . "\"");
    readfile($routes[$uri]["FILE"]);
    exit;
}
// Merge additional GET and POST parameters from the routes array
$_GET = [...$_GET, ...$routes[$uri]["GET"] ?? []];
$_POST = [...$_POST, ...$routes[$uri]["POST"] ?? []];
// Check if we're on localhost for DEVbugging
$NOTENV_APP_ENV = $_SERVER["HTTP_HOST"] === "localhost" ? "DEV" : "PROD";
?>
<script>
    // Store environment and routing information in localStorage for client-side use
    localStorage.setItem("APP_ENV", "<?= $_ENV["APP_ENV"] ?? $NOTENV_APP_ENV; ?>");
    localStorage.setItem("APP_VERSION", "<?= $_ENV["APP_VERSION"] ?? "0.1by"; ?>");
    localStorage.setItem("URI", "<?= $uri; ?>");
    localStorage.setItem("URL", "<?= $url; ?>");
    localStorage.setItem("ROUTES", JSON.stringify(<?= json_encode($routes) ?>));
    localStorage.setItem("_GET", JSON.stringify(<?= json_encode($_GET) ?>));
    localStorage.setItem("_POST", JSON.stringify(<?= json_encode($_POST) ?>));
</script>