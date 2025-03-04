<?php
require_once "../_var.php";
require_once $TO_HOME . "_functions.php";
echo date("Y") . PHP_EOL;
echo "<script>console.log(Math.floor(Date.now()/1000));</script>" . time() . PHP_EOL;
$test = validate_value("0");
echo $test != "0" ? "true" : "false" . PHP_EOL;
$ARRAY = ["id" => "override"];
if (!isset($_GET["id"])) $_GET["id"] = "test";
print_json($_GET);
print_json($ARRAY);
print_json([...$_GET, ...$ARRAY]);
print_json([...$ARRAY, ...$_GET]);
print_json(array_merge($_GET, $ARRAY));
print_json(array_merge($ARRAY, $_GET));
