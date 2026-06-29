<?php
// This is an example of how you can use SPA.php files along side yours.
//require_once "{$TO_HOME}/spa.php/_common.php";
// Just call the SPA.php file and add whatever you need below
$LANG = $LANG ?? [];
if (file_exists("{$TO_HOME}/lang/{$APP_LANG}.php")) require_once "{$TO_HOME}/lang/{$APP_LANG}.php";
// Language fallbacks if lang is supported but file doesn't exist
$preferred_lang = substr($_SERVER["HTTP_ACCEPT_LANGUAGE"] ?? "es", 0, 2);
if (!$LANG && file_exists("{$TO_HOME}/lang/{$preferred_lang}.php")) require_once "{$TO_HOME}/lang/{$preferred_lang}.php";
if (!$LANG && file_exists("{$TO_HOME}/lang/en.php")) require_once "{$TO_HOME}/lang/en.php";

$titles = [
	0 => $LANG["title.default"],
	"home" => $LANG["title.home"],
	"page" => $LANG["title.page"],
	"video" => $LANG["title.video"],
	"socket-server" => $LANG["title.socket_server"],
	"socket-client" => $LANG["title.socket_client"],
];
