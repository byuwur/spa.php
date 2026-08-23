<?php
$_GET["title"] = "page";
require_once "./_var.php";
require_once "{$TO_HOME}/_functions.php";
require_once "{$TO_HOME}/_common.php";
//require_once "{$TO_HOME}/_plugins.php";
//require_once "{$TO_HOME}/_config.php";
//require_once "{$TO_HOME}/_routes.php";
//require_once "{$TO_HOME}/_router.php";
//require_once "{$TO_HOME}/_auth.php";
// --- PHP ---
require_once "{$TO_HOME}/common.example.php";
//enable_progressive_rendering();
?>
<div class="video-foreground app-container">
  <div
    class="container vh-100 d-flex flex-column align-items-center justify-content-center text-white text-dark-shadow">
    <p><?= escape_html($LANG["demo.description"]) ?></p>
    <p><?= escape_html($LANG["demo.this_is"] . " " . $LANG["nav.page"] . ".") ?></p>
    <p><?= escape_html($LANG["nav.page"] . ": ") ?><b><i>"<?= escape_html($LANG["demo.page.description"]) ?>"</i></b></p>
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