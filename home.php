<!DOCTYPE html>
<?php
/*
 * File: home.php
 * Desc: Entry point for the Single Page Application (SPA). This file initializes configurations, handles routing, and loads the main structure of the SPA, including the header, content container, and footer. The page also includes necessary CSS and JS resources.
 * Deps: _var.php, _common.php, _functions.php, _plugin.php, _routes.php, _router.php
 * Copyright (c) 2023 Andrés Trujillo [Mateus] byUwUr
 */

// Sets a flag to enable the inclusion of local storage variables in the HTML output
$setLocalStorage = true;
// Include the main variable configuration file
require_once "./_var.php";
// Include common functions and initializations
require_once $TO_HOME . "_common.php";
// Include utility functions
require_once $TO_HOME . "_functions.php";
// Include composer libraries
require_once $TO_HOME . "_plugins.php";
// Include database connections
//require_once $TO_HOME . "_config.php";
// Load the routes configuration
require_once $TO_HOME . "_routes.php";
// Route the request based on the URI
require_once $TO_HOME . "_router.php";
// Include auth management
//require_once $TO_HOME . "_auth.php";

// --- PHP ---
?>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>Easy PHP SPA | byUwUr</title>
    <link rel="icon" type="image/png" href="<?= $HOME_PATH; ?>/img/byuwur.png" />
    <link rel="stylesheet" href="<?= $HOME_PATH; ?>/css/bootstrap.min.css" />
    <link rel="stylesheet" href="<?= $HOME_PATH; ?>/css/fontawesome.min.css" />
    <link rel="stylesheet" href="<?= $HOME_PATH; ?>/_common.css" />
    <script src="<?= $HOME_PATH; ?>/js/jquery-3.3.1.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/js/bootstrap.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/_functions.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/_common.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/_spa.js" defer></script>
    <script src="https://www.google.com/recaptcha/api.js" defer></script>
</head>

<body>
    <!-- byuwur/easy-spa-php | Copyright (c) 2023 Andrés Trujillo [Mateus] byUwUr -->
    <div id="spa-loader">
        <div class="load-circle-back"></div>
        <div class="load-circle-fore"></div>
        <div class="load-text"><?= $load; ?></div>
    </div>
    <video class="video-container" muted loop autoplay>
        <source src="<?= $HOME_PATH; ?>/img/bg.mp4" type="video/mp4" />
        <source src="<?= $HOME_PATH; ?>/img/bg.webm" type="video/webm" />
    </video>
    <nav id="spa-nav"></nav>
    <main id="spa-content"></main>
</body>

</html>
<?php
// Always call due to /_var.php invoking ob_start();
ob_end_flush();
?>