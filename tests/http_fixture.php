<?php
if (isset($_GET["truncated"])) {
  // cURL receives a partial response after the POST has reached this endpoint.
  header("Content-Length: 100");
  header("Connection: close");
  echo "partial";
  exit;
}
if (($_SERVER["REQUEST_URI"] ?? "") === "/missing") {
  http_response_code(404);
  exit;
}
if (isset($_GET["malformed"])) {
  echo "not-json";
  exit;
}
header("Content-Type: application/json");
echo json_encode(isset($_GET["post"]) ? $_POST : $_GET);
