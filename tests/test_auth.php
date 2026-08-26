<?php
$_SERVER = ["REMOTE_ADDR" => "127.0.0.1", "HTTP_HOST" => "localhost", "SERVER_PORT" => "80", "SCRIPT_FILENAME" => __FILE__, "PHP_SELF" => "/tests/test_auth.php"];
$_ENV = [];
require_once __DIR__ . "/../_init.php";
require_once __DIR__ . "/../_functions.php";
require_once __DIR__ . "/../_auth.php";

function auth_assert(bool $condition, string $message): void
{
  if (!$condition)
    throw new RuntimeException($message);
  echo "[PASS] {$message}" . PHP_EOL;
}

$before_login = session_id();
login(["username" => "tester", "logintime" => time() - 10]);
$after_login = session_id();
auth_assert($after_login !== $before_login, "login() regenerates the session ID by default.");

$before_check = session_id();
$old_logintime = $_SESSION["logintime"];
session_check();
auth_assert(session_id() === $before_check, "session_check() preserves the current session ID.");
auth_assert($_SESSION["logintime"] >= $old_logintime, "session_check() refreshes login activity.");

$_SESSION["logintime"] = time() - 3601;
auth_assert(session_check() === false && session_status() !== PHP_SESSION_ACTIVE, "Expired sessions are logged out.");

session_start();
$_SESSION = ["logintime" => time()];
auth_assert(session_check() === false && session_status() !== PHP_SESSION_ACTIVE, "Sessions without a username are logged out.");
