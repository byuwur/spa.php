<?php
/*
 * File: _auth.php
 * Desc: Handles user auth and session management
 * Deps: /_var.php, $TO_HOME . "_functions.php", $TO_HOME . "_config.php", $TO_HOME . "_routes.php";
 * Copyright (c) 2024 Andrés Trujillo [Mateus] byUwUr
 */

// At start it always checks if a session_name is provided through query params;
// This case applies when you want to manipulate an specific session on the server. Proceed with caution
// if that's the case, set that session_id accordingly
if (validate_value($_POST[session_name()] ?? null) !== null) session_id($_POST[session_name()]);
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
    setcookie(session_name(), session_id(), time() + 3600, '/', '', true, true);
    $_SESSION = array_merge($_SESSION, $session);
    return true;
}

/**
 * Logs the user out by clearing session data and destroying the session.
 * @return bool Always returns false.
 */
function logout()
{
    $_SESSION = [];
    session_unset();
    session_destroy();
    setcookie(session_name(), '', time() - 600, '/', '', true, true);
    return false;
}

/**
 * Validates the session based on login time and username, logging the user out if invalid or expired.
 * @return bool True if the session is valid, false if the user is logged out.
 */
function check_session()
{
    if (validate_value($_SESSION["logintime"] ?? null) === null) return logout();
    if (validate_value($_SESSION["username"] ?? null) === null) return logout();
    if (time() - $_SESSION["logintime"] > 3600) return logout();
    return login(["logintime" => time()]);
}
