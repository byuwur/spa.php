<?php
$_GET["title"] = "socket-server";
require_once "./_var.php";
require_once "{$TO_HOME}/_common.php";
require_once "{$TO_HOME}/_functions.php";
require_once "{$TO_HOME}/_plugins.php";
//require_once "{$TO_HOME}/_config.php";
//require_once "{$TO_HOME}/_routes.php";
//require_once "{$TO_HOME}/_router.php";
//require_once "{$TO_HOME}/_auth.php";
// --- PHP ---
require_once "{$TO_HOME}/common.example.php";
//enable_progressive_rendering();
?>
<div class="video-foreground app-container">
    <div class="container vh-100 d-flex flex-column align-items-start justify-content-center text-white text-dark-shadow">
        <a href="<?= "{$HOME_PATH}/websocket/start.php" ?>">WS START</a>
        <a href="<?= "{$HOME_PATH}/websocket/stop.php" ?>">WS STOP</a>
        <pre id="ws_log">

        </pre>
    </div>
</div>
<script>
    $(() => {
        document.title = "<?= $titles[$title_index] ?>";
        byCommon.init();
    });
</script>
<?php
while (ob_get_level() > 0) ob_end_flush();
?>