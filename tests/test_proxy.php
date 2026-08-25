<?php
$_SERVER = ["REMOTE_ADDR" => "203.0.113.10", "HTTP_HOST" => "example.test", "SERVER_PORT" => "80", "SCRIPT_FILENAME" => __FILE__, "PHP_SELF" => "/tests/test_proxy.php"];
$_ENV = [];
require_once __DIR__ . "/../_var.php";

function proxy_assert(bool $condition, string $message): void
{
  if (!$condition)
    throw new RuntimeException($message);
  echo "[PASS] {$message}" . PHP_EOL;
}

proxy_assert(public_scheme() === "http", "Direct HTTP is detected.");
$_SERVER["HTTP_X_FORWARDED_PROTO"] = "https";
proxy_assert(public_scheme() === "http", "Untrusted forwarding headers are ignored.");
$_ENV["TRUST_PROXY"] = "true";
$_ENV["TRUSTED_PROXIES"] = "203.0.113.10";
proxy_assert(public_scheme() === "https", "Trusted proxy protocol is accepted.");
$_ENV["APP_URL"] = "https://public.example/app/";
proxy_assert(public_scheme() === "https", "Explicit APP_URL has priority.");
