<?php
/*
 * File: _routes.php
 * Desc: Defines the routing map for the application, including URIs, GET/POST parameters, and associated components.
 * Deps: none
 * Copyright (c) 2023 Andrés Trujillo [Mateus] byUwUr
 */

// Hierarchy
$ROOT_ROUTE = "/";

// Default components to include on each route
$ROOT_COMPONENTS = ["COMPONENT" => ["#spa-nav" => "/sidebar.php"]];

// Route definitions
$routes = [
    // Format: "/uri" => ["URI" => "/file.php", "GET" => [...], "POST" => [...], "COMPONENT" => [...]]

    // "/"
    $ROOT_ROUTE => ["URI" => "/main.php", ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "es" => ["URI" => "", "GET" => ["lang" => "es"], ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "en" => ["URI" => "", "GET" => ["lang" => "en"], ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "inicio" => ["URI" => "/main.php", "GET" => ["lang" => "es"], ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "home" => ["URI" => "/main.php", "GET" => ["lang" => "en"], ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "pagina1" => ["URI" => "/page1.php", "GET" => ["lang" => "es"], ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "page1" => ["URI" => "/page1.php", "GET" => ["lang" => "en"], ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "pagina2" => ["URI" => "/page2.php", "GET" => ["lang" => "es"], ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "page2" => ["URI" => "/page2.php", "GET" => ["lang" => "en"], ...$ROOT_COMPONENTS],
];
