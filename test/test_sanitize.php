<?php
require_once "../_var.php";
require_once $TO_HOME . "_functions.php";
$_GET = ["field1" => "test", "field2" => "testing", "field3" => 1];
$_POST = [
    "data" => [
        ["arr1test1" => "value1", "arr1test2" => "value2"],
        ["arr2test1" => "value1", "arr2test2" => "value2"],
        ["arr3test1" => "value1", "arr3test2" => "value2"],
    ]
];
// Curate data from GET
$get = [];
foreach ($_GET as $key => $value)
    $get[$key] = validate_value($value);
// Curate data from POST
$post = [];
if (isset($_POST["data"]) && is_array($_POST["data"])) foreach ($_POST["data"] as $i => $post_data) {
    $curated = [];
    foreach ($post_data as $key => $value)
        $curated[$key] = validate_value($value);
    $post[] = $curated;
}
print_r("=\$data=<br>");
print_json($get);
print_r("<br>=\$data=<br>");
print_json($post);
