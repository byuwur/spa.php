<?php

if (file_exists($TO_HOME . "lang/" . $app_lang . ".php")) {
    require_once $TO_HOME . "lang/" . $app_lang . ".php";

    $titles = [
        0 => "SPA.PHP | byUwUr",
        "home" => "SPA " . $home . " | byUwUr",
        "page" => "SPA " . $page . " | byUwUr"
    ];
}
