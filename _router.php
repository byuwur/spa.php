<?php
/* 
 * File: _router.php
 * Desc: Processes and routes incoming URIs based on predefined routes, handling URL parameters and errors. If a matching file is found, it serves the file with appropriate headers; otherwise, it prepares the environment for client-side routing.
 * Deps: /_init.php, "{$TO_HOME}/_functions.php", "{$TO_HOME}/_plugin.php"; $routes OR "{$TO_HOME}/_routes.php" MUST be previously defined/called.
 * Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr
 */

// The rule must be previously configured in .htaccess or nginx.conf
// Initialize the URI from the GET parameter, defaulting to "/"
// Keep the browser query separately from the rewrite-only `uri` value so the
// initial client fragment request receives the same ordinary query parameters.
$request_query = $_GET;
unset($request_query["uri"]);
$uri = is_string($_GET["uri"] ?? null) ? $_GET["uri"] : "/";
// Ensure the URI starts with a "/" and doesn't end with one
if (!str_starts_with($uri, "/"))
  $uri = "/" . ltrim($uri, "/");
while (strlen($uri) > 1 && substr($uri, -1) == "/")
  $uri = substr($uri, 0, -1);
// Store the processed URI
$url = $uri . (count($request_query) ? "?" . http_build_query($request_query) : "");
// Fail early with a useful message instead of allowing malformed routes to
// produce obscure client-side errors later.
if (!is_array($routes))
  error_crash(500, "Routes must be an array.");
foreach ($routes as $route_path => $route) {
  if (!is_string($route_path) || !is_array($route))
    error_crash(500, "Invalid route definition for \"{$route_path}\".");
  if (!isset($route["URI"]) && !isset($route["FILE"]))
    error_crash(500, "Route \"{$route_path}\" must define URI or FILE.");
  foreach (["URI", "FILE"] as $field)
    if (isset($route[$field]) && !is_string($route[$field]))
      error_crash(500, "Route \"{$route_path}\" field {$field} must be a string.");
  foreach (["GET", "POST", "COMPONENT"] as $field)
    if (isset($route[$field]) && !is_array($route[$field]))
      error_crash(500, "Route \"{$route_path}\" field {$field} must be an array.");
}
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
  if (!$file_path)
    error_crash(404, "File route \"{$uri}\" does not exist.");
  while (ob_get_level() > 0)
    ob_end_clean();
  header("Content-Type: " . get_mime_type($file_path));
  header("Content-Disposition: inline; filename=\"" . basename($file_path) . "\"");
  readfile($file_path);
  exit;
}
// Programmed route data is authoritative over /$/ values and ordinary query data.
// $route["GET"] >>> /$/ >>> ?query
$_GET = [...$_GET, ...$routes[$uri]["GET"] ?? []];
$_POST = [...$_POST, ...$routes[$uri]["POST"] ?? []];
// Apply the route language after its parameters have been merged
if (isset($_GET["lang"])) {
  $APP_LANG = $_GET["lang"];
  setcookie("lang", $APP_LANG, time() + 31536000, "/", "", false, false);
}
// Render the document language and client settings after route overrides
if (isset($setLocalStorage) && $setLocalStorage) {
  ?>
  <html lang="<?= escape_html($APP_LANG) ?>" dir="ltr">
  <?php
}
?>
<script>
  // Store environment and routing information in localStorage for client-side use
  byStorage.setItem("APP_LANG", <?= js_encode($APP_LANG) ?>);
  byStorage.setItem("APP_THEME", <?= js_encode($APP_THEME) ?>);
  <?php if (($_ENV["APP_ENV"] ?? $NOTENV_APP_ENV) === "DEV") { ?>
    console.log("=== PHP ===",);
    console.log("APP_ENV", <?= js_encode($_ENV["APP_ENV"] ?? $NOTENV_APP_ENV) ?>);
    console.log("APP_VERSION", <?= js_encode($_ENV["APP_VERSION"] ?? "0.1by") ?>);
    console.log("URI", <?= js_encode($uri) ?>);
    console.log("URL", <?= js_encode($url) ?>);
    console.log("ROUTES", JSON.stringify(<?= js_encode($routes) ?>));
    console.log("_GET", JSON.stringify(<?= js_encode($_GET) ?>));
    console.log("_POST", JSON.stringify(<?= js_encode($_POST) ?>));
    console.log("=== PHP ===",);
  <?php } ?>
  byStorage.setItem("APP_ENV", <?= js_encode($_ENV["APP_ENV"] ?? $NOTENV_APP_ENV) ?>);
  byStorage.setItem("APP_VERSION", <?= js_encode($_ENV["APP_VERSION"] ?? "0.1by") ?>);
  byStorage.setItem("URI", <?= js_encode($uri) ?>);
  byStorage.setItem("URL", <?= js_encode($url) ?>);
  byStorage.setItem("ROUTES", JSON.stringify(<?= js_encode($routes) ?>));
  byStorage.setItem("_GET", JSON.stringify(<?= js_encode($_GET) ?>));
  byStorage.setItem("_POST", JSON.stringify(<?= js_encode($_POST) ?>));
</script>