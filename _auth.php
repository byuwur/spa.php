<?php
/*
 * File: _auth.php
 * Desc: Handles user auth and session management
 * Deps: /_var.php, "{$TO_HOME}/_functions.php", "{$TO_HOME}/_config.php", "{$TO_HOME}/_routes.php";
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

ini_set("session.use_strict_mode", "1");
$is_https = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] != "off") || (($_SERVER["SERVER_PORT"] ?? "") == "443");
// Set the cookie params for the session, keep it secure
$has_session_set_cookie = session_set_cookie_params([
    "lifetime" => 3600,
    "path" => "/",
    "domain" => "",
    "secure" => $is_https,
    "httponly" => true,
    "samesite" => "Strict"
]);
// Crash if cookie cannot be configured
if (!$has_session_set_cookie) api_respond(500, true, "Session crash.");
// At start it always checks if a session_name is provided through query params;
// This case applies when you want to manipulate an specific session on the server. Proceed with caution
// if that's the case, set that session_id accordingly
$allow_post_session_id = filter_var($_ENV["ALLOW_POST_SESSION_ID"] ?? false, FILTER_VALIDATE_BOOLEAN);
if (
    $allow_post_session_id &&
    session_status() === PHP_SESSION_NONE &&
    validate_value($_POST[session_name()] ?? null) !== null
) session_id($_POST[session_name()]);
// Then start it to use it
session_start();

/**
 * Logs the user in by regenerating session ID if requested and merging session data.
 * @param array $session Data to merge with the current session.
 * @param bool $regen Whether to regenerate the session ID.
 * @return bool Always returns true.
 */
function login($session = [], $regen = false)
{
    if ($regen) session_regenerate_id(true);
    //setcookie(session_name(), session_id(), time() + 3600, "/", "", true, true);
    $_SESSION = [...$_SESSION, ...$session];
    return true;
}

/**
 * Returns a per-session CSRF token.
 * @return string CSRF token
 */
function csrf_token(): string
{
    if (empty($_SESSION["csrf_token"])) $_SESSION["csrf_token"] = bin2hex(random_bytes(32));
    return $_SESSION["csrf_token"];
}

/**
 * Validates a CSRF token against the current session.
 * @param string|null $token Token submitted by the client.
 * @return bool Whether the token matches.
 */
function csrf_check(?string $token): bool
{
    return is_string($token) && isset($_SESSION["csrf_token"]) && hash_equals($_SESSION["csrf_token"], $token);
}

/**
 * Logs the user out by clearing session data and destroying the session.
 * @return bool Always returns false.
 */
function logout()
{
    global $is_https;
    if (session_status() != PHP_SESSION_ACTIVE) return false;
    $session_file = session_save_path() . "/sess_" . session_id();
    $_SESSION = [];
    session_unset();
    session_gc();
    session_destroy();
    setcookie(session_name(), "", [
        "expires" => time() - 600,
        "path" => "/",
        "domain" => "",
        "secure" => $is_https,
        "httponly" => true,
        "samesite" => "Strict"
    ]);
    if (file_exists($session_file)) @unlink($session_file);
    return false;
}

/**
 * Validates the session based on login time and username, logging the user out if invalid or expired.
 * @return bool True if the session is valid, false if the user is logged out.
 */
function session_check()
{
    if (validate_value($_SESSION["logintime"] ?? null) === null) return logout();
    if (validate_value($_SESSION["username"] ?? null) === null) return logout();
    if (time() - $_SESSION["logintime"] > 3600) return logout();
    $_GET = [...$_GET, ...$_SESSION];
    $_POST = [...$_POST, ...$_SESSION];
    return login(["logintime" => time()]);
}
