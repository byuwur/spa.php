<?php
// This is an example of how you can use SPA.php files along side yours.
//require_once "{$TO_HOME}/spa.php/_common.php";
// Just call the SPA.php file and add whatever you need below
if (file_exists("{$TO_HOME}/lang/{$APP_LANG}.php")) {
    require_once "{$TO_HOME}/lang/{$APP_LANG}.php";

    $titles = [
        0 => "SPA.PHP | byUwUr",
        "home" => "SPA " . $home . " | byUwUr",
        "page" => "SPA " . $page . " | byUwUr",
        "video" => "SPA " . $video . " | byUwUr",
        "socket-server" => "SPA Socket Server | byUwUr",
        "socket-client" => "SPA Socker Client | byUwUr"
    ];
}
