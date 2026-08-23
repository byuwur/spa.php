<!DOCTYPE html>
<?php
/*
 * File: home.php
 * Desc: Entry point for the Single Page Application (SPA). This file initializes configurations, handles routing, and loads the main structure of the SPA, including the header, content container, and footer. The page also includes necessary CSS and JS resources.
 * Deps: ./_var.php, _common.php, _functions.php, _plugins.php, ./_routes.php, _router.php
 * Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr
 */

// Sets a flag to enable the inclusion of local storage variables in the HTML output
$setLocalStorage = true;
// Include the main variable configuration file
require_once "./_var.php";
// Include utility functions
require_once "{$TO_HOME}/../_functions.php";
// Include common functions and initializations
require_once "{$TO_HOME}/../_common.php";
// Include composer libraries
require_once "{$TO_HOME}/../_plugins.php";
// Include database connections
//require_once "{$TO_HOME}/../_config.php";
// Load the routes configuration
require_once "{$TO_HOME}/_routes.php";
// Route the request based on the URI
require_once "{$TO_HOME}/../_router.php";
// Include auth management
//require_once "{$TO_HOME}/_auth.php";

// --- PHP ---
require_once "{$TO_HOME}/common.example.php";
//enable_progressive_rendering();
?>

<head>
  <title><?= escape_html($LANG["title.default"]) ?></title>
  <meta charset="utf-8" />
  <meta property="og:title" content="<?= escape_html($LANG["title.default"]) ?>" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://byuwur.co/img/logo.png" />
  <meta property="og:image:alt" content="SPA.php | byUwUr" />
  <meta property="og:url" content="<?= escape_html($LANG["meta.url"]) ?>" />
  <meta property="og:site_name" content="SPA.php | byUwUr" />
  <meta property="og:description" content="<?= escape_html($LANG["meta.description"]) ?>" />
  <meta property="og:locale" content="<?= escape_html($LANG["meta.locale"]) ?>" />
  <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no" />
  <meta name="description" content="<?= escape_html($LANG["meta.description"]) ?>" />
  <meta name="author" content="Andrés Trujillo Mateus" />
  <meta name="keywords" content="<?= escape_html($LANG["meta.keywords"]) ?>" />
  <meta name="copyright" content="[Mateus] byUwUr" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:creator" content="@byUwUr" />
  <meta name="twitter:title" content="<?= escape_html($LANG["title.default"]) ?>" />
  <meta name="twitter:description" content="<?= escape_html($LANG["meta.description"]) ?>" />
  <meta name="twitter:image" content="https://byuwur.co/img/logo.png" />
  <meta name="twitter:image:alt" content="SPA.php | byUwUr" />
  <meta name="theme-color" content="#300" />
  <link rel="canonical" href="<?= escape_html($LANG["meta.url"]) ?>" />
  <link rel="alternate" hreflang="es" href="https://byuwur.co/spa.php/demo/es" />
  <link rel="alternate" hreflang="en" href="https://byuwur.co/spa.php/demo/en" />
  <link rel="alternate" hreflang="ja" href="https://byuwur.co/spa.php/demo/ja" />
  <link rel="alternate" hreflang="x-default" href="https://byuwur.co/spa.php" />
  <link rel="icon" type="image/png" href="<?= "{$HOME_PATH}/../img/byuwur.png" ?>" />
  <link rel="apple-touch-icon" href="<?= "{$HOME_PATH}/../img/byuwur.png" ?>" />
  <!-- Remove per your needs -->
  <link rel="stylesheet" href="<?= "{$HOME_PATH}/../css/animate.min.css" ?>" />
  <link rel="stylesheet" href="<?= "{$HOME_PATH}/../css/fontawesome.min.css" ?>" />
  <link rel="stylesheet" href="<?= "{$HOME_PATH}/../css/jquery-ui.min.css" ?>" />
  <link rel="stylesheet" href="<?= "{$HOME_PATH}/../css/shards.css" ?>" />
  <link rel="stylesheet" href="<?= "{$HOME_PATH}/../css/bootstrap.min.css" ?>" />
  <link rel="stylesheet" href="<?= "{$HOME_PATH}/../css/swiper.min.css" ?>" />
  <link rel="stylesheet" href="<?= "{$HOME_PATH}/../css/video.min.css" ?>" />
  <link rel="stylesheet" href="<?= "{$HOME_PATH}/../css/select2.min.css" ?>" />
  <link rel="stylesheet" href="<?= "{$HOME_PATH}/../css/dropzone.min.css" ?>" />
  <link rel="stylesheet" href="<?= "{$HOME_PATH}/../_common.css" ?>" />
  <script src="<?= "{$HOME_PATH}/../js/jquery.min.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../js/jquery-ui.min.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../js/popper.min.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../js/shards.min.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../js/bootstrap.min.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../js/swiper.min.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../js/video.min.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../js/select2.full.min.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../js/dropzone.min.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../js/typed.min.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../js/particles-ui.min.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../js/cookies.min.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../_functions.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../_common.js" ?>" defer></script>
  <script src="<?= "{$HOME_PATH}/../_spa.js" ?>" defer></script>
  <script src="https://www.google.com/recaptcha/api.js" defer></script>
  <script src="https://translate.google.com/translate_a/element.js?cb=byCommon.initTranslate" defer></script>
  <!-- Add your overrides below -->
</head>

<body>
  <!-- byuwur/spa.php | Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr -->
  <noscript>
    <section aria-labelledby="noscript-title">
      <h1 id="noscript-title"><?= escape_html($LANG["title.default"]) ?></h1>
      <p><?= escape_html($LANG["meta.description"]) ?></p>
      <p><?= escape_html($LANG["demo.description"]) ?></p>
      <p><a href="https://github.com/byuwur/spa.php">GitHub</a></p>
    </section>
  </noscript>
  <section id="intro" class="d-none">
    <!-- Add a short description to help SEO -->
    <?= escape_html($LANG["meta.description"]) ?>
  </section>
  <div id="spa-loader">
    <div class="load-circle-back"></div>
    <div class="load-circle-fore"></div>
    <div class="load-text"><?= $LANG["loader.loading"] // Trusted loader markup from the bundled language files. ?></div>
  </div>
  <div id="bywr-accessibility" class="uncolor-links">
    <a href="javascript:byCommon.accessibilityToggle();" role="button" data-bs-toggle="tooltip"
      data-bs-title="<?= escape_html($LANG["accessibility.open_panel"]) ?>"
      title="<?= escape_html($LANG["accessibility.open_panel"]) ?>"
      aria-label="<?= escape_html($LANG["accessibility.open_panel"]) ?>">
      <i class="fas fa-universal-access"></i>
    </a>
    <div id="bywr-accessibility-buttons" class="hide">
      <a href="javascript:byCommon.accessibilityText('plus');" role="button" data-bs-toggle="tooltip"
        data-bs-title="<?= escape_html($LANG["accessibility.increase_text"]) ?>"
        title="<?= escape_html($LANG["accessibility.increase_text"]) ?>"
        aria-label="<?= escape_html($LANG["accessibility.increase_text"]) ?>">
        <i class="fas fa-magnifying-glass-plus"></i>
      </a>
      <a href="javascript:byCommon.accessibilityText();" role="button" data-bs-toggle="tooltip"
        data-bs-title="<?= escape_html($LANG["accessibility.reset_text"]) ?>"
        title="<?= escape_html($LANG["accessibility.reset_text"]) ?>"
        aria-label="<?= escape_html($LANG["accessibility.reset_text"]) ?>">
        <i class="fas fa-magnifying-glass"></i>
      </a>
      <a href="javascript:byCommon.accessibilityText('minus');" role="button" data-bs-toggle="tooltip"
        data-bs-title="<?= escape_html($LANG["accessibility.decrease_text"]) ?>"
        title="<?= escape_html($LANG["accessibility.decrease_text"]) ?>"
        aria-label="<?= escape_html($LANG["accessibility.decrease_text"]) ?>">
        <i class="fas fa-magnifying-glass-minus"></i>
      </a>
      <a href="javascript:byCommon.accessibilityMotion();" role="button" data-bs-toggle="tooltip"
        data-bs-title="<?= escape_html($LANG["accessibility.toggle_motion"]) ?>"
        title="<?= escape_html($LANG["accessibility.toggle_motion"]) ?>"
        aria-label="<?= escape_html($LANG["accessibility.toggle_motion"]) ?>">
        <i class="fas fa-wind"></i>
      </a>
      <a href="javascript:byCommon.accessibilityDyslexia();" role="button" data-bs-toggle="tooltip"
        data-bs-title="<?= escape_html($LANG["accessibility.dyslexia"]) ?>"
        title="<?= escape_html($LANG["accessibility.dyslexia"]) ?>"
        aria-label="<?= escape_html($LANG["accessibility.dyslexia"]) ?>">
        <i class="fas fa-font"></i>
      </a>
      <a href="javascript:byCommon.accessibilityWordSpacing();" role="button" data-bs-toggle="tooltip"
        data-bs-title="<?= escape_html($LANG["accessibility.word_spacing"]) ?>"
        title="<?= escape_html($LANG["accessibility.word_spacing"]) ?>"
        aria-label="<?= escape_html($LANG["accessibility.word_spacing"]) ?>">
        <i class="fas fa-text-width"></i>
      </a>
      <a href="javascript:byCommon.accessibilityHighlightLinks();" role="button" data-bs-toggle="tooltip"
        data-bs-title="<?= escape_html($LANG["accessibility.highlight_links"]) ?>"
        title="<?= escape_html($LANG["accessibility.highlight_links"]) ?>"
        aria-label="<?= escape_html($LANG["accessibility.highlight_links"]) ?>">
        <i class="fas fa-link"></i>
      </a>
      <a href="javascript:byCommon.accessibilityHighContrast();" role="button" data-bs-toggle="tooltip"
        data-bs-title="<?= escape_html($LANG["accessibility.high_contrast"]) ?>"
        title="<?= escape_html($LANG["accessibility.high_contrast"]) ?>"
        aria-label="<?= escape_html($LANG["accessibility.high_contrast"]) ?>">
        <i class="fas fa-circle-half-stroke"></i>
      </a>
      <a href="javascript:byCommon.accessibilityHighContrast('invertchropia');" role="button" data-bs-toggle="tooltip"
        data-bs-title="<?= escape_html($LANG["accessibility.invert_colors"]) ?>"
        title="<?= escape_html($LANG["accessibility.invert_colors"]) ?>"
        aria-label="<?= escape_html($LANG["accessibility.invert_colors"]) ?>">
        <i class="fas fa-droplet"></i>
      </a>
      <a href="javascript:byCommon.accessibilityHighContrast('monochropia');" role="button" data-bs-toggle="tooltip"
        data-bs-title="<?= escape_html($LANG["accessibility.grayscale"]) ?>"
        title="<?= escape_html($LANG["accessibility.grayscale"]) ?>"
        aria-label="<?= escape_html($LANG["accessibility.grayscale"]) ?>">
        <i class="fas fa-droplet-slash"></i>
      </a>
      <a href="javascript:byCommon.accessibilityHighContrast('protanopia');" role="button" data-bs-toggle="tooltip"
        data-bs-title="<?= escape_html($LANG["accessibility.protanopia"]) ?>"
        title="<?= escape_html($LANG["accessibility.protanopia"]) ?>"
        aria-label="<?= escape_html($LANG["accessibility.protanopia"]) ?>">
        <i class="fas fa-eye"></i>
      </a>
      <a href="javascript:byCommon.accessibilityHighContrast('deuteranopia');" role="button" data-bs-toggle="tooltip"
        data-bs-title="<?= escape_html($LANG["accessibility.deuteranopia"]) ?>"
        title="<?= escape_html($LANG["accessibility.deuteranopia"]) ?>"
        aria-label="<?= escape_html($LANG["accessibility.deuteranopia"]) ?>">
        <i class="fas fa-eye-slash"></i>
      </a>
      <a href="javascript:byCommon.accessibilityHighContrast('tritanopia');" role="button" data-bs-toggle="tooltip"
        data-bs-title="<?= escape_html($LANG["accessibility.tritanopia"]) ?>"
        title="<?= escape_html($LANG["accessibility.tritanopia"]) ?>"
        aria-label="<?= escape_html($LANG["accessibility.tritanopia"]) ?>">
        <i class="fas fa-eye-low-vision"></i>
      </a>
    </div>
  </div>
  <video class="video-container" muted loop autoplay playsinline>
    <source src="<?= "{$HOME_PATH}/img/bg.mp4" ?>" type="video/mp4" />
  </video>
  <div id="particles"></div>
  <div id="g-translate"></div>
  <nav id="spa-nav"></nav>
  <main id="spa-content"></main>
  <footer id="spa-foot"></footer>
</body>

</html>
<?php
while (ob_get_level() > 0)
  ob_end_flush();
?>