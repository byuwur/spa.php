<?php
$get = isset($_GET["testget"]) ? $_GET["testget"] : "";
$post = isset($_POST["testpost"]) ? $_POST["testpost"] : "";
echo "GET= " . $get . "<br>POST= " . $post . "<br>";
var_dump($_GET);
var_dump($_POST);
exit;
