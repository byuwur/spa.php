<?php
if (($_SERVER["REQUEST_URI"] ?? "") === "/missing") {
  http_response_code(404);
  exit;
}
if (isset($_GET["malformed"])) {
  echo "not-json";
  exit;
}
header("Content-Type: application/json");
echo json_encode($_GET);
