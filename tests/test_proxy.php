<?php
$_SERVER = ["REMOTE_ADDR" => "203.0.113.10", "HTTP_HOST" => "example.test", "SERVER_PORT" => "80", "SCRIPT_FILENAME" => __FILE__, "PHP_SELF" => "/tests/test_proxy.php"];
$_ENV = [];
require_once __DIR__ . "/../_init.php";

function proxy_assert(bool $condition, string $message): void
{
  if (!$condition)
    throw new RuntimeException($message);
  echo "[PASS] {$message}" . PHP_EOL;
}

$application_root = std_dir_separator(realpath(__DIR__ . "/.."));
$demo_home = file_get_contents(__DIR__ . "/../demo/home.php");
proxy_assert(basename($THIS__FILE__) === "_init.php", "The renamed initialization file loads.");
proxy_assert($SYSTEM_ROOT === $application_root && $HOME_PATH === $application_root && $TO_HOME === "..", "Nested entry-point paths remain application-relative.");
proxy_assert(strpos($demo_home, '"./_init.php"') < strpos($demo_home, '"{$TO_HOME}/_routes.php"') && strpos($demo_home, '"{$TO_HOME}/_routes.php"') < strpos($demo_home, '"{$TO_HOME}/../_router.php"'), "Initialization runs before routes and the router.");
proxy_assert(str_contains(file_get_contents(__DIR__ . "/../_init.php"), "global.byStorage"), "Early byStorage initialization remains available.");

proxy_assert(public_scheme() === "http", "Direct HTTP is detected.");
$_SERVER["HTTP_X_FORWARDED_PROTO"] = "https";
proxy_assert(public_scheme() === "http", "Untrusted forwarding headers are ignored.");
$_ENV["TRUST_PROXY"] = "true";
$_ENV["TRUSTED_PROXIES"] = "203.0.113.10";
proxy_assert(public_scheme() === "https", "Trusted proxy protocol is accepted.");
$_ENV["APP_URL"] = "https://public.example/app/";
proxy_assert(public_scheme() === "https", "Explicit APP_URL has priority.");
