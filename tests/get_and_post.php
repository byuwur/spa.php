<?php
header("Content-Type: text/plain; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
$get = isset($_GET["testget"]) ? $_GET["testget"] : "";
$post = isset($_POST["testpost"]) ? $_POST["testpost"] : "";
echo "GET= " . $get . "\nPOST= " . $post . "\n";
var_dump($_GET);
var_dump($_POST);
exit;
