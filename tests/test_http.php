<?php
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
$command = escapeshellarg(PHP_BINARY) . " -S 127.0.0.1:{$port} -t " . escapeshellarg(__DIR__);
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
