<!DOCTYPE html>
<?php
/*
 * File: home.php
 * Desc: Entry point for the Single Page Application (SPA). This file initializes configurations, handles routing, and loads the main structure of the SPA, including the header, content container, and footer. The page also includes necessary CSS and JS resources.
 * Deps: _var.php, _common.php, _functions.php, _plugin.php, _routes.php, _router.php
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
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
require_once $TO_HOME . "common.php";
?>

<head>
    <title>SPA.php | byUwUr</title>
    <meta charset="utf-8" />
    <meta property="og:title" content="SPA.php | byUwUr" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://byuwur.co/img/logo.png" />
    <meta property="og:url" content="https://byuwur.co/spa.php" />
    <meta property="og:site_name" content="SPA.php | byUwUr" />
    <meta property="og:description" content="SPA made easy, with love, and PHP." />
    <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no" />
    <meta name="description" content="SPA made easy, with love, and PHP." />
    <meta name="author" content="Andrés Trujillo [Mateus] byUwUr" />
    <meta name="keywords" content="SPA.php, SPA, PHP, Mateus, byUwUr, byuwur, Mateus byUwUr" />
    <meta name="copyright" content="[Mateus] byUwUr" />
    <!--meta name="robots" content="index, follow" /> <!-- Decommented to get indexed -->
    <meta name="theme-color" content="#300" />
    <link rel="icon" type="image/png" href="<?= $HOME_PATH; ?>/img/byuwur.png" />
    <link rel="apple-touch-icon" href="<?= $HOME_PATH; ?>/img/byuwur.png" />
    <!-- Remove per your needs -->
    <link rel="stylesheet" href="<?= $HOME_PATH; ?>/css/animate.min.css" />
    <link rel="stylesheet" href="<?= $HOME_PATH; ?>/css/fontawesome.min.css" />
    <link rel="stylesheet" href="<?= $HOME_PATH; ?>/css/jquery-ui.min.css" />
    <link rel="stylesheet" href="<?= $HOME_PATH; ?>/css/shards.css" />
    <link rel="stylesheet" href="<?= $HOME_PATH; ?>/css/bootstrap.min.css" />
    <link rel="stylesheet" href="<?= $HOME_PATH; ?>/css/swiper.min.css" />
    <link rel="stylesheet" href="<?= $HOME_PATH; ?>/css/video.min.css" />
    <link rel="stylesheet" href="<?= $HOME_PATH; ?>/css/select2.min.css" />
    <link rel="stylesheet" href="<?= $HOME_PATH; ?>/css/dropzone.min.css" />
    <link rel="stylesheet" href="<?= $HOME_PATH; ?>/_common.css" />
    <script src="<?= $HOME_PATH; ?>/js/jquery.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/js/jquery-ui.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/js/popper.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/js/shards.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/js/bootstrap.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/js/swiper.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/js/video.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/js/select2.full.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/js/dropzone.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/js/typed.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/js/particles.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/js/cookies.min.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/_functions.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/_common.js" defer></script>
    <script src="<?= $HOME_PATH; ?>/_spa.js" defer></script>
    <script src="https://www.google.com/recaptcha/api.js" defer></script>
    <script src="https://translate.google.com/translate_a/element.js?cb=byCommon.initTranslate" defer></script>
    <!-- Add your overrides below -->
</head>

<body>
    <!-- byuwur/spa.php | Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr -->
    <div id="spa-loader">
        <div class="load-circle-back"></div>
        <div class="load-circle-fore"></div>
        <div class="load-text"><?= $load; ?></div>
    </div>
    <section id="intro" class="d-none">
        <!-- Add a short description to help SEO -->
        SPA made easy, with love, and PHP. — byUwUr/SPA.php
    </section>
    <div id="bywr-accessibility">
        <a href="javascript:byCommon.accessibilityToggle();" data-bs-toggle="tooltip" data-bs-title="Accesibilidad" title="Accesibilidad">
            <i class="fas fa-universal-access"></i>
        </a>
        <div id="bywr-accessibility-buttons" class="hide">
            <a href="javascript:byCommon.accessibilityText('plus');" data-bs-toggle="tooltip" data-bs-title="Aumentar tamaño de texto" title="Aumentar tamaño de texto">
                <i class="fas fa-magnifying-glass-plus"></i>
            </a>
            <a href="javascript:byCommon.accessibilityText();" data-bs-toggle="tooltip" data-bs-title="Reiniciar tamaño de texto" title="Reiniciar tamaño de texto">
                <i class="fas fa-magnifying-glass"></i>
            </a>
            <a href="javascript:byCommon.accessibilityText('minus');" data-bs-toggle="tooltip" data-bs-title="Disminuir tamaño de texto" title="Disminuir tamaño de texto">
                <i class="fas fa-magnifying-glass-minus"></i>
            </a>
            <a href="javascript:byCommon.accessibilityMotion();" data-bs-toggle="tooltip" data-bs-title="Alternar animaciones" title="Alternar animaciones">
                <i class="fas fa-wind"></i>
            </a>
            <a href="javascript:byCommon.accessibilityDyslexia();" data-bs-toggle="tooltip" data-bs-title="Apto para dislexia" title="Apto para dislexia">
                <i class="fas fa-font"></i>
            </a>
            <a href="javascript:byCommon.accessibilityWordSpacing();" data-bs-toggle="tooltip" data-bs-title="Texto espaciado" title="Texto espaciado">
                <i class="fas fa-text-width"></i>
            </a>
            <a href="javascript:byCommon.accessibilityHighlightLinks();" data-bs-toggle="tooltip" data-bs-title="Resaltar enlaces" title="Resaltar enlaces">
                <i class="fas fa-link"></i>
            </a>
            <a href="javascript:byCommon.accessibilityHighContrast();" data-bs-toggle="tooltip" data-bs-title="Alto contraste" title="Alto contraste">
                <i class="fas fa-circle-half-stroke"></i>
            </a>
            <a href="javascript:byCommon.accessibilityHighContrast('invertchropia');" data-bs-toggle="tooltip" data-bs-title="Invertir colores" title="Invertir colores">
                <i class="fas fa-droplet"></i>
            </a>
            <a href="javascript:byCommon.accessibilityHighContrast('monochropia');" data-bs-toggle="tooltip" data-bs-title="Escala de grises" title="Escala de grises">
                <i class="fas fa-droplet-slash"></i>
            </a>
            <a href="javascript:byCommon.accessibilityHighContrast('protanopia');" data-bs-toggle="tooltip" data-bs-title="Protanopia" title="Protanopia">
                <i class="fas fa-eye"></i>
            </a>
            <a href="javascript:byCommon.accessibilityHighContrast('deuteranopia');" data-bs-toggle="tooltip" data-bs-title="Deuteranopia" title="Deuteranopia">
                <i class="fas fa-eye-slash"></i>
            </a>
            <a href="javascript:byCommon.accessibilityHighContrast('tritanopia');" data-bs-toggle="tooltip" data-bs-title="Tritanopia" title="Tritanopia">
                <i class="fas fa-eye-low-vision"></i>
            </a>
        </div>
    </div>
    <video class="video-container" muted loop autoplay playsinline>
        <source src="<?= $HOME_PATH; ?>/img/bg.mp4" type="video/mp4" />
        <source src="<?= $HOME_PATH; ?>/img/bg.webm" type="video/webm" />
    </video>
    <div id="particles"></div>
    <div id="g-translate"></div>
    <nav id="spa-nav"></nav>
    <main id="spa-content"></main>
</body>

</html>
<?php
// Always call due to /_var.php invoking ob_start();
ob_end_flush();
?>