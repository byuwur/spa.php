<?php
if (PHP_SAPI !== "cli") {
  http_response_code(403);
  exit;
}
require_once __DIR__ . "/../_functions.php";

function expect_same(mixed $expected, mixed $actual, string $description): void
{
  if ($expected !== $actual) {
    throw new RuntimeException($description . "\nExpected " . var_export($expected, true) . "\nReceived " . var_export($actual, true));
  }
}

// ===== TERMINATING RESPONSES =====

// Run each terminating helper in a child so a missing exit or stray output fails the parent test.
if (isset($argv[1])) {
  ob_start();
  print "buffered output";
  switch ($argv[1]) {
    case "discard-json":
    case "keep-json":
      exit_json("saved", $argv[1] === "discard-json");
      break;
    case "redirect":
    case "invalid-redirect-status":
      $status = $argv[1] === "redirect" ? 303 : 200;
      register_shutdown_function(static function () use ($status) {
        expect_same($status === 303 ? 303 : 307, http_response_code(), "Redirect status");
      });
      change_location("/next", $status);
      break;
    default:
      throw new InvalidArgumentException("Unknown test case");
  }
  throw new RuntimeException("The response helper returned to its caller.");
}

$expectedBodies = [
  "discard-json" => '"saved"',
  "keep-json" => 'buffered output"saved"',
  "redirect" => "",
  "invalid-redirect-status" => "",
];
foreach ($expectedBodies as $case => $expectedBody) {
  $process = proc_open([PHP_BINARY, __FILE__, $case], [1 => ["pipe", "w"]], $pipes);
  if (!is_resource($process)) throw new RuntimeException("Could not start {$case}");
  $body = stream_get_contents($pipes[1]);
  fclose($pipes[1]);
  expect_same(0, proc_close($process), "{$case} must terminate successfully");
  expect_same($expectedBody, $body, "{$case} response body");
}

// ===== ROUTE METADATA =====

$route = [
  "title" => 'Notes & "examples"',
  "canonical" => "https://example.test/notes",
  "image" => "https://example.test/cover.png",
  "og:title" => "Social title",
  "twitter:card" => false,
  "unsupported" => "unused",
];
$values = route_metadata_values($route);
expect_same($route["title"], $values["twitter:title"], "Page title supplies the Twitter title");
expect_same("Social title", $values["og:title"], "Explicit social title takes precedence");
expect_same($route["canonical"], $values["og:url"], "Canonical supplies the Open Graph URL");
expect_same($route["image"], $values["twitter:image"], "Image supplies the Twitter image");
expect_same(false, array_key_exists("twitter:card", $values), "Social fields require string values");
expect_same(false, array_key_exists("unsupported", $values), "Unknown metadata is omitted");

$head = new DOMDocument();
$metadata = render_route_metadata($route, ["title" => "Home & work", "robots" => "index"]);
$head->loadHTML(/* HTML */"<html><head>{$metadata}</head></html>");
$title = $head->getElementsByTagName("title")->item(0);
expect_same($route["title"], $title->textContent, "Escaped title renders as text");
expect_same("Home & work", $title->getAttribute("data-spa-default"), "Shell title can be restored on navigation");
$xpath = new DOMXPath($head);
expect_same(1, $xpath->query('//link[@rel="canonical" and @data-spa-metadata]')->length, "One managed canonical link");
expect_same(1, $xpath->query('//meta[@name="robots" and @content="index" and not(@data-spa-metadata)]')->length, "Shell-only fields remain unmanaged");

// ===== VALIDATION AND STRINGS =====

$range = ["min" => 0, "max" => 2];
expect_same(0, validate_value("0", "int", $range), "Zero is a valid lower bound");
expect_same(2, validate_value(" 2 ", "int", $range), "The upper bound is inclusive");
expect_same(null, validate_value("3", "int", $range), "Values above the range are invalid");
expect_same(false, validate_value("off", "bool"), "False is a valid boolean");
expect_same(null, validate_value("unknown", "bool"), "Unknown boolean is invalid");
expect_same(null, validate_value(["1"], "int"), "Arrays cannot supply scalar fields");
$required = ["page" => "int", "active" => "bool"];
expect_same(["page"], validate_keys(["active" => false], $required), "Strict validation reports missing keys");
expect_same([], validate_keys(["active" => false], $required, false), "Relaxed validation accepts one valid key");
expect_same(["page", "active"], validate_keys([], $required, false), "Relaxed validation reports when all keys are missing");
$_ENV["APP_ENV"] = "PROD";
$publicError = api_validate_keys("GET", [], $required, true, false);
expect_same(true, $publicError !== "" && !str_contains($publicError, "active"), "Public validation error omits field names");
$_ENV["APP_ENV"] = "DEV";
expect_same(true, str_contains(api_validate_keys("GET", [], $required, true, false), "page, active"), "Development errors identify invalid fields");
expect_same(["id"], common_keys([["id" => 0, "extra" => 1], ["other" => 2, "id" => null]]), "Common keys are independent of their values");
expect_same("hello world_2", normalize_string(" Hello!  WORLD_2 ", "lower", ["_"]), "Normalization preserves permitted punctuation");
$token = random_string(24);
expect_same(24, strlen($token), "Random string length");
expect_same(true, ctype_alnum($token), "Random string alphabet");
expect_same("", random_string(0), "Empty random string");

// ===== HTML AND JSON OUTPUT =====

$message = 'Notes </script> & "examples"';
$encoded = js_encode($message);
expect_same(false, str_contains($encoded, "<"), "An inline JSON string cannot close its script");
expect_same($message, json_decode($encoded, true, 512, JSON_THROW_ON_ERROR), "Inline JSON preserves the original message");
expect_same("null", js_encode("\xFF"), "Invalid UTF-8 has a valid JavaScript fallback");
expect_same(/* HTML */'&lt;b&gt; &amp; &quot;x&quot;<br />
y', escape_html('<b> &amp; "x"
y', true), "Multiline escaping preserves existing entities");
expect_same(true, check_json("null"), "JSON null is valid");
expect_same(false, check_json("{"), "Incomplete JSON is invalid");
ob_start();
print_json('{"page":0}');
expect_same(["page" => 0], json_decode(ob_get_clean(), true, 512, JSON_THROW_ON_ERROR), "Existing JSON is printed as an object");

foreach (["log", "warn", "error"] as $level) {
  $logger = "console_{$level}";
  ob_start();
  $logger($message);
  $document = new DOMDocument();
  $document->loadHTML(ob_get_clean());
  $scripts = $document->getElementsByTagName("script");
  expect_same(1, $scripts->length, "One script for console.{$level}");
  expect_same("console.{$level}({$encoded});", trim($scripts->item(0)->textContent), "Console level and encoded argument");
}

ob_start();
show_modal_back("success", "Saved", "Changes recorded", false, "/done");
$document = new DOMDocument();
$document->loadHTML(ob_get_clean());
expect_same("/done", $document->getElementById("modal_back_ok")->getAttribute("href"), "Modal confirmation destination");
expect_same(true, str_contains($document->getElementById("modal_back")->textContent, "Changes recorded"), "Modal displays the supplied message");

// ===== FILE TYPES =====

expect_same("image/jpeg", get_mime_type("photo.JPEG"), "Filename lookup ignores extension case");
expect_same("application/octet-stream", get_mime_type("README"), "Unknown file type uses the binary fallback");
expect_same("jpeg", get_file_extension(" Image/JPEG; charset=binary", "photo.JPEG"), "MIME lookup preserves a compatible extension");
expect_same("jpg", get_file_extension("image/jpeg", "photo.txt"), "Incompatible extension uses the MIME type's preferred extension");
expect_same(null, get_file_extension("application/x-unknown", "file.txt"), "Unknown MIME type has no suggested extension");

fwrite(STDOUT, "PHP function tests passed.\n");
