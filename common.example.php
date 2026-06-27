<?php
// This is an example of how you can use SPA.php files along side yours.
//require_once "{$TO_HOME}/spa.php/_common.php";
// Just call the SPA.php file and add whatever you need below
if (file_exists("{$TO_HOME}/lang/{$APP_LANG}.php")) {
  require_once "{$TO_HOME}/lang/{$APP_LANG}.php";
  $LANG = $LANG ?? [];

  $titles = [
    0 => $LANG["title.default"],
    "home" => $LANG["title.home"],
    "page" => $LANG["title.page"],
    "video" => $LANG["title.video"],
    "socket-server" => $LANG["title.socket_server"],
    "socket-client" => $LANG["title.socket_client"]
  ];
}
