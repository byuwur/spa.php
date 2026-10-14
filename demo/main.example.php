<?php
$_GET["title"] = "home";
require_once "./_init.php";
require_once "{$TO_HOME}/../_functions.php";
require_once "{$TO_HOME}/../_common.php";
//require_once "{$TO_HOME}/../_plugins.php";
//require_once "{$TO_HOME}/../_config.php";
require_once "{$TO_HOME}/_routes.php";
//require_once "{$TO_HOME}/../_router.php";
//require_once "{$TO_HOME}/../_auth.php";
// --- PHP ---
require_once "{$TO_HOME}/common.example.php";
//enable_progressive_rendering();
?>
<div class="spa-demo-home video-foreground app-container d-flex">
  <div class="d-flex align-items-center flex-grow-1 p-4 p-lg-5">
    <section class="home-copy fs-5 text-white text-dark-shadow" aria-labelledby="home-title">
      <p class="small fw-bold mb-0">SIMPLE IS COMPLICATED ENOUGH.</p>
      <h1 id="home-title" class="display-2 fw-bold lh-1 my-3">
        <span><?= escape_html($LANG["demo.home.heading"]) ?></span>
        <span><?= escape_html($LANG["demo.home.subheading"]) ?></span>
      </h1>
      <p class="home-text fs-4 lh-base"><?= escape_html($LANG["demo.home.description"]) ?></p>
      <ul class="list-unstyled d-flex flex-wrap gap-3 my-4 small">
        <li><i class="fas fa-route me-1" aria-hidden="true"></i> <span><?= escape_html($LANG["demo.home.routes"]) ?></span></li>
        <li><i class="fas fa-language me-1" aria-hidden="true"></i> <span><?= escape_html($LANG["demo.home.languages"]) ?></span></li>
        <li><i class="fas fa-code me-1" aria-hidden="true"></i> <span><?= escape_html($LANG["demo.home.setup"]) ?></span></li>
      </ul>
      <div class="d-flex flex-wrap gap-2 text-no-shadow">
        <a class="btn btn-primary btn-lg" href="<?= escape_html("/{$ROUTE_KIT}") ?>">
          <i class="fas fa-layer-group me-1" aria-hidden="true"></i> <span><?= escape_html($LANG["demo.home.explore"]) ?></span>
        </a>
        <a class="btn btn-outline-light btn-lg" href="https://github.com/byuwur/spa.php" target="_blank" rel="noopener">
          <i class="fab fa-github me-1" aria-hidden="true"></i> GitHub
        </a>
        <a class="btn btn-outline-light btn-lg" href="https://github.com/byuwur/spa.php#usage" target="_blank" rel="noopener">
          <i class="fas fa-book-open me-1" aria-hidden="true"></i> <span><?= escape_html($LANG["demo.home.docs"]) ?></span>
        </a>
      </div>
      <nav class="d-flex flex-wrap align-items-center gap-3 mt-4" aria-label="<?= escape_html($LANG["demo.home.demos"]) ?>">
        <span class="small"><?= escape_html($LANG["demo.home.try"]) ?></span>
        <a class="link" href="<?= escape_html("/{$ROUTE_JSON}") ?>"><i class="fas fa-code me-1" aria-hidden="true"></i> JSON</a>
        <a class="link" href="<?= escape_html("/{$ROUTE_MD}") ?>"><i class="fab fa-markdown me-1" aria-hidden="true"></i> Markdown</a>
        <a class="link" href="<?= escape_html("/{$ROUTE_VIDEO}") ?>"><i class="fas fa-video me-1" aria-hidden="true"></i> <span><?= escape_html($LANG["demo.home.video"]) ?></span></a>
      </nav>
      <p class="small mt-4 mb-0"><?= escape_html($LANG["demo.home.continuity"]) ?></p>
    </section>
  </div>
</div>
<script>
  $(() => {
    document.title = <?= js_encode($titles[$title_index]) ?>;
    byCommon.init();
  });
</script>
<?php
while (ob_get_level() > 0)
  ob_end_flush();
?>