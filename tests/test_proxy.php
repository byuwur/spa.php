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
$spa_runtime = file_get_contents(__DIR__ . "/../_spa.js");
proxy_assert(basename($THIS__FILE__) === "_init.php", "The renamed initialization file loads.");
proxy_assert($SYSTEM_ROOT === $application_root && $HOME_PATH === $application_root && $TO_HOME === "..", "Nested entry-point paths remain application-relative.");
proxy_assert(strpos($demo_home, '"./_init.php"') < strpos($demo_home, '"{$TO_HOME}/_routes.php"') && strpos($demo_home, '"{$TO_HOME}/_routes.php"') < strpos($demo_home, '"{$TO_HOME}/../_router.php"'), "Initialization runs before routes and the router.");
proxy_assert(str_contains(file_get_contents(__DIR__ . "/../_init.php"), "global.byStorage"), "Early byStorage initialization remains available.");
$init_source = file_get_contents(__DIR__ . "/../_init.php");
proxy_assert(str_contains($init_source, 'rtrim($HOME_PATH, "/") . "/"'), "Browser storage is namespaced from the finalized application root.");
proxy_assert(str_contains($init_source, "localStorage.removeItem(key)"), "Successful legacy storage migration removes the old key.");
preg_match_all('/bySPA\.VERSION\s*=\s*"([^"]+)";/', $spa_runtime, $framework_versions);
proxy_assert(count($framework_versions[1]) === 1 && $framework_versions[1][0] !== "", "The SPA runtime has one framework version source.");
proxy_assert(str_contains($spa_runtime, 'bySPA.APP_VERSION = byStorage.getItem("APP_VERSION") ?? "0.1by";'), "The consuming application version remains unchanged.");
proxy_assert(strpos($spa_runtime, "bySPA.VERSION =") < strpos($spa_runtime, 'console.log("SPA_VERSION=", bySPA.VERSION);'), "The framework version is initialized before DEV startup logging.");

proxy_assert(public_scheme() === "http", "Direct HTTP is detected.");
$_SERVER["HTTP_X_FORWARDED_PROTO"] = "https";
proxy_assert(public_scheme() === "http", "Untrusted forwarding headers are ignored.");
$_ENV["TRUST_PROXY"] = "true";
$_ENV["TRUSTED_PROXIES"] = "203.0.113.10";
proxy_assert(public_scheme() === "https", "Trusted proxy protocol is accepted.");
$_ENV["APP_URL"] = "https://public.example/app/";
proxy_assert(public_scheme() === "https", "Explicit APP_URL has priority.");
