<?php
/*
 * File: _routes.php
 * Desc: Defines the routing map for the application, including URIs, GET/POST parameters, and associated components.
 * Deps: none
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

// Hierarchy
$ROOT_ROUTE = "/";

// Default components to include on each route
$ROOT_COMPONENTS = ["COMPONENT" => ["nav#spa-nav" => "/sidebar.php"]];

// Route definitions
$routes = [
    // Format: "/uri" => ["URI" => "/file.php", "GET" => [...], "POST" => [...], "COMPONENT" => [...]]

    // "/"
    $ROOT_ROUTE => ["URI" => "/main.example.php", ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "es" => ["URI" => "", "GET" => ["lang" => "es"], ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "en" => ["URI" => "", "GET" => ["lang" => "en"], ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "inicio" => ["URI" => "/main.example.php", "GET" => ["lang" => "es"], ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "home" => ["URI" => "/main.example.php", "GET" => ["lang" => "en"], ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "pagina" => ["URI" => "/page.example.php", "GET" => ["lang" => "es"], ...$ROOT_COMPONENTS],
    $ROOT_ROUTE . "page" => ["URI" => "/page.example.php", "GET" => ["lang" => "en"], ...$ROOT_COMPONENTS],
];
