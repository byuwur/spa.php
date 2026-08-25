<?php
require_once __DIR__ . "/../_functions.php";
ob_start();
echo "noise";
api_respond(200, false, "ok", ["value" => 1]);
