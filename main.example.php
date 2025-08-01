<?php
$_GET["title"] = "home";
require_once "./_var.php";
require_once "{$TO_HOME}/_common.php";
//require_once "{$TO_HOME}/_functions.php";
//require_once "{$TO_HOME}/_plugins.php";
//require_once "{$TO_HOME}/_config.php";
require_once "{$TO_HOME}/_routes.php";
//require_once "{$TO_HOME}/_router.php";
//require_once "{$TO_HOME}/_auth.php";
// --- PHP ---
require_once "{$TO_HOME}/common.example.php";
?>
<div class="video-foreground app-container">
    <div class="container vh-100 d-flex flex-column align-items-center justify-content-center">
        <div class="text-white text-dark-shadow">
            <p><?= $description ?></p>
            <p><?= "{$thisis} {$home}." ?></p>
            <p><?= "{$home}: " ?><b><i>"<?= $home_desc ?>"</i></b></p>
            <hr class="w-100" />
            <a href="<?= "{$ROUTE_ROOT}{$ROUTE_VIDEO}" ?>" class="link"><?= $video ?></a>
        </div>
    </div>
</div>
<script>
    $(() => {
        document.title = "<?= $titles[$title_index] ?>";
        byCommon.init();
    });
</script>
<?php
// Always call due to /_var.php invoking ob_start();
ob_end_flush();
?>