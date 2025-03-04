<?php
require_once "../_var.php";
require_once $TO_HOME . "_functions.php";
$get = [
    "testget" => "GETTER",
    "get1" => "get1",
    "get2" => "get2"
];
$post = [
    "testpost" => "POSTTER",
    "post1" => "post1",
    "post2" => "post2",
    [
        "id" => "1",
        "name" => "2",
        "value" => "3"
    ],
    [
        "id" => "2",
        "name" => "3",
        "value" => "1"
    ]
];
echo make_http_request($HOME_PATH . "/test/getpost.php", $get, $post);
exit;
