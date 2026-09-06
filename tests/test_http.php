<?php
if (PHP_SAPI !== "cli") {
  http_response_code(403);
  exit;
}
$_SERVER = ["REMOTE_ADDR" => "127.0.0.1", "HTTP_HOST" => "localhost", "SERVER_PORT" => "80", "SCRIPT_FILENAME" => __FILE__, "PHP_SELF" => "/tests/test_http.php"];
$_ENV = ["APP_ENV" => "PROD"];
require_once __DIR__ . "/../_init.php";
require_once __DIR__ . "/../_functions.php";

function http_assert(bool $condition, string $message): void
{
  if (!$condition)
    throw new RuntimeException($message);
  echo "[PASS] {$message}" . PHP_EOL;
}

function captured_request(callable $request): array
{
  ob_start();
  $result = $request();
  return [$result, ob_get_clean()];
}

[$invalid, $quiet_output] = captured_request(fn() => make_http_request("not-a-url", [], [], false, false));
http_assert($invalid === null && $quiet_output === "", "Invalid URLs stay quiet when frontend logging is disabled.");
[, $logged_output] = captured_request(fn() => make_http_request("not-a-url", [], [], false, true));
http_assert(str_contains($logged_output, "console.error"), "Invalid URLs can emit an explicit frontend diagnostic.");

$socket = stream_socket_server("tcp://127.0.0.1:0", $errno, $error);
if (!$socket)
  throw new RuntimeException("Unable to reserve a local test port: {$errno} {$error}");
$port = (int) substr(strrchr(stream_socket_get_name($socket, false), ":"), 1);
fclose($socket);
$log = tempnam(sys_get_temp_dir(), "spa-http-test-");
$command = [PHP_BINARY, "-S", "127.0.0.1:{$port}", "-t", __DIR__];
$process = proc_open($command, [["pipe", "r"], ["file", $log, "a"], ["file", $log, "a"]], $pipes);
if (!is_resource($process))
  throw new RuntimeException("Unable to start the local HTTP fixture.");

try {
  $ready = false;
  for ($attempt = 0; $attempt < 50; $attempt++) {
    $connection = @fsockopen("127.0.0.1", $port);
    if (is_resource($connection)) {
      fclose($connection);
      $ready = true;
      break;
    }
    usleep(20000);
  }
  if (!$ready)
    throw new RuntimeException("Local HTTP fixture did not start.");

  $base = "http://127.0.0.1:{$port}/http_fixture.php";
  foreach (["get_and_post.php?testget=%3Cb%3Einert%3C%2Fb%3E", "test_pass.php?test=%3Cb%3Einert%3C%2Fb%3E"] as $diagnostic) {
    $context = stream_context_create(["http" => ["method" => "POST", "header" => "Content-Type: application/x-www-form-urlencoded", "content" => "testpost=%3Cb%3Einert%3C%2Fb%3E"]]);
    $body = file_get_contents("http://127.0.0.1:{$port}/{$diagnostic}", false, $context);
    $headers = strtolower(implode("\n", $http_response_header));
    http_assert(str_contains($headers, "content-type: text/plain") && str_contains($headers, "x-content-type-options: nosniff"), "Diagnostics declare inert text before output.");
    http_assert(str_contains($body, "<b>inert</b>"), "Local diagnostics preserve input as text.");
  }
  [$truncated, $truncated_output] = captured_request(fn() => make_http_request("{$base}?truncated=1", [], ["mutation" => "once"]));
  http_assert($truncated === false && $truncated_output === "", "Partial POST responses preserve the quiet false failure result.");
  http_assert(substr_count(file_get_contents($log), "POST /http_fixture.php?truncated=1") === 1, "A received POST is never replayed after a partial response.");
  $posted = make_http_request("{$base}?post=1", [], ["value" => "once"], true);
  http_assert($posted === ["value" => "once"], "Successful POST preserves its body and decoded response.");
  $denied = @file_get_contents("http://127.0.0.1:{$port}/test_sql.php");
  http_assert($denied === false && str_contains($http_response_header[0], "403"), "CLI-only fixtures reject execution even on the local HTTP server.");
  $plain = json_decode(make_http_request($base, ["added" => "value"]), true);
  http_assert(($plain["added"] ?? null) === "value", "GET data is appended to URLs without a query.");
  $merged = json_decode(make_http_request("{$base}?fixed=1#section", ["added" => "value"]), true);
  http_assert(($merged["fixed"] ?? null) === "1" && ($merged["added"] ?? null) === "value", "GET data preserves existing queries and URL fragments.");

  [$malformed, $malformed_output] = captured_request(fn() => make_http_request("{$base}?malformed=1", [], [], true, false));
  http_assert($malformed === "not-json" && $malformed_output === "", "Malformed JSON stays quiet when frontend logging is disabled.");
  http_assert(remote_file_exists($base), "remote_file_exists() accepts successful responses.");
  http_assert(!remote_file_exists("http://127.0.0.1:{$port}/missing"), "remote_file_exists() rejects failed responses.");

  [, $curl_output] = captured_request(fn() => make_http_request("http://127.0.0.1:1/unavailable", [], [], false, false));
  http_assert($curl_output === "", "cURL failures stay quiet when frontend logging is disabled.");
} finally {
  proc_terminate($process);
  proc_close($process);
  if (is_file($log))
    unlink($log);
}
