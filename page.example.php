<?php
$_GET["title"] = "page";
require_once "./_var.php";
require_once "{$TO_HOME}/_common.php";
//require_once "{$TO_HOME}/_functions.php";
//require_once "{$TO_HOME}/_plugins.php";
//require_once "{$TO_HOME}/_config.php";
//require_once "{$TO_HOME}/_routes.php";
//require_once "{$TO_HOME}/_router.php";
//require_once "{$TO_HOME}/_auth.php";
// --- PHP ---
require_once "{$TO_HOME}/common.example.php";
?>
<div class="video-foreground app-container">
    <div class="container vh-100 d-flex flex-column align-items-center justify-content-center text-white text-dark-shadow">
        <p><?= $description ?></p>
        <p><?= "{$thisis} {$page}." ?></p>
        <p><?= "{$page}: " ?><b><i>"<?= $page_desc ?>"</i></b></p>
    </div>
</div>
<script>
    $(() => {
        document.title = "<?= $titles[$title_index] ?>";
        byCommon.init();
    });
</script>
<?php
// Progressive output by calling ob_flush(); flush();
while (ob_get_level() > 0) ob_end_flush();
?>