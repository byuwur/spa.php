<?php
/*
 * File: _routes.php
 * Desc: Defines the routing map for the application, including URIs, GET/POST parameters, and associated components.
 * Deps: none
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

// URIs
$ROUTE_ROOT = "/";

$ROUTE_HOME_ES = "inicio";
$ROUTE_PAGE_ES = "pagina";
$ROUTE_HOME_EN = "home";
$ROUTE_PAGE_EN = "page";
$ROUTE_VIDEO = "video";
$ROUTE_SOCKET_SERVER = "socket-server";
$ROUTE_SOCKET_CLIENT = "socket-client";

switch ($APP_LANG) {
    case "es":
    default:
        $ROUTE_HOME = "inicio";
        $ROUTE_PAGE = "pagina";
        break;
    case "en":
        $ROUTE_HOME = "home";
        $ROUTE_PAGE = "page";
        break;
}

$ROUTE_ES = "es";
$ROUTE_EN = "en";
$ROUTE_ERROR = "error";
$ROUTE_LOGIN = "login";
$ROUTE_LOGOUT = "logout";
$ROUTE_DEMO = "demo";
$ROUTE_COOKIES = "cookies";

// Default components to include on each route
$COMPONENTS_EMPTY = ["COMPONENT" => ["nav#spa-nav" => "", "footer#spa-foot" => ""]];
$ROOT_COMPONENTS = ["COMPONENT" => ["nav#spa-nav" => "/sidebar.php"]];

// Route definitions
$routes = [
    // Format: "/uri" => ["URI" => "/file.php", "GET" => [...], "POST" => [...], "COMPONENT" => [...]]

    // "/"
    "{$ROUTE_ROOT}" => ["URI" => "/main.example.php", ...$ROOT_COMPONENTS],
    "/{$ROUTE_ES}" => ["URI" => "", "GET" => ["lang" => "es"], ...$ROOT_COMPONENTS],
    "/{$ROUTE_EN}" => ["URI" => "", "GET" => ["lang" => "en"], ...$ROOT_COMPONENTS],
    "/{$ROUTE_HOME_ES}" => ["URI" => "/main.example.php", "GET" => ["lang" => "es"], ...$ROOT_COMPONENTS],
    "/{$ROUTE_HOME_EN}" => ["URI" => "/main.example.php", "GET" => ["lang" => "en"], ...$ROOT_COMPONENTS],
    "/{$ROUTE_PAGE_ES}" => ["URI" => "/page.example.php", "GET" => ["lang" => "es"], ...$ROOT_COMPONENTS],
    "/{$ROUTE_PAGE_EN}" => ["URI" => "/page.example.php", "GET" => ["lang" => "en"], ...$ROOT_COMPONENTS],
    "/{$ROUTE_VIDEO}" => ["URI" => "/video.example.php", "GET" => [], ...$ROOT_COMPONENTS],
    "/{$ROUTE_SOCKET_SERVER}" => ["URI" => "/websocket.server.php", "GET" => [], ...$ROOT_COMPONENTS],
    "/{$ROUTE_SOCKET_CLIENT}" => ["URI" => "/websocket.client.php", "GET" => [], ...$ROOT_COMPONENTS],
];
