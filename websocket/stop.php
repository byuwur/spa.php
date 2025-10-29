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
$PORT = $_ENV["WEBSOCKET_PORT_DEFAULT"] ?? 6969;
?>
<pre>
<?php
echo "/websocket/stop: [{$now}]" . "\n";
if (is_port_in_use($PORT)) {
    echo "✖️ Closing websocket on port {$PORT}..." . "\n";
    $find_pid = "for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :{$PORT}')";
    $pid = trim(shell_exec("{$find_pid} do @echo %a"));
    echo $pid . "\n";
    $cmd = "{$find_pid} do taskkill /PID %a /F";
    console_log("Run: {$cmd}");
    pclose(popen($cmd, "r"));
    echo "✅ Websocket closed.";
} else {
    echo "⚠️ No websocket running on port {$PORT}.";
}
?>
</pre>
<?php
while (ob_get_level() > 0) ob_end_flush();
?>