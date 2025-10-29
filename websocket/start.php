<?php
$INVOKER__FILE__ = __FILE__;
$INVOKER__DIR__ = __DIR__;
$IS_PHP_ON_SERVER = false;
//$debug = true;
require_once "../_var.php";
require_once "{$TO_HOME}/_common.php";
require_once "{$TO_HOME}/_functions.php";
require_once "{$TO_HOME}/_plugins.php";
//require_once "{$TO_HOME}/_config.php";
//require_once "{$TO_HOME}/_routes.php";
//require_once "{$TO_HOME}/_router.php";
//require_once "{$TO_HOME}/_auth.php";
// --- PHP ---
require_once "{$TO_HOME}/common.example.php";
enable_progressive_rendering();
$now = date("Y-m-d_H-i-s");
$PHP_PATH = php_where();
$PORT = $_ENV["WEBSOCKET_PORT_DEFAULT"] ?? 6969;
$WS_DIR = "{$SYSTEM_ROOT}/websocket";
$WS_LOG_FILES = glob("{$WS_DIR}/*.log");
$WS_SERVER_PATH = "{$WS_DIR}/server.php";
$WS_LOG_NOW = "{$WS_DIR}/{$now}.log";
// Get all log files in websocket/
usort($WS_LOG_FILES, function ($a, $b) {
    return filemtime($b) - filemtime($a);
});
// Delete anything after the first 3
foreach (array_slice($WS_LOG_FILES, 3) as $old_log) @unlink($old_log);
?>
<pre>
<?php
echo "/websocket/start: [{$now}]" . "\n";
if (!is_port_in_use($PORT, true)) {
    echo "🚀 Launching websocket on port {$PORT}..." . "\n";
    $cmd = "start /B {$PHP_PATH} \"{$WS_SERVER_PATH}\" > \"{$WS_LOG_NOW}\" 2>&1";
    console_log("Run: {$cmd}");
    pclose(popen($cmd, "r"));
    echo "✅ Websocket started.";
}
?>
</pre>
<?php
while (ob_get_level() > 0) ob_end_flush();
?>