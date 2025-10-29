<?php
$INVOKER__FILE__ = __FILE__;
$INVOKER__DIR__ = __DIR__;
$IS_PHP_ON_SERVER = false;
//$debug = true;
require_once "../_var.php";
while (ob_get_level() > 0) ob_end_flush();
//require_once "{$TO_HOME}/spa.php/_common.php";
//require_once "{$TO_HOME}/spa.php/_functions.php";
//require_once "{$TO_HOME}/_functions.php";
//require_once "{$TO_HOME}/spa.php/_plugins.php";
//require_once "{$TO_HOME}/_plugins.php";
//require_once "{$TO_HOME}/_config.php";
//require_once "{$TO_HOME}/_routes.php";
//require_once "{$TO_HOME}/spa.php/_router.php";
//require_once "{$TO_HOME}/spa.php/_auth.php";
//require_once "{$TO_HOME}/_auth.php";
//require_once "{$TO_HOME}/_common.php";
require_once "{$HOME_PATH}/_functions.php";
if (file_exists("{$HOME_PATH}/vendor/autoload.php")) require_once "{$HOME_PATH}/vendor/autoload.php";
// --- PHP ---
#$dotenv = Dotenv\Dotenv::createImmutable($TO_HOME);
#$dotenv->load();
$WS_PORT = $_ENV["WEBSOCKET_PORT_DEFAULT"] ?? 6996;
$WS_PATH = $_ENV["WEBSOCKET_PATH_DEFAULT"] ?? "/spa.ws";
echo "🟡 Starting socket..." . "\n";

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\App;

class WebSocket implements MessageComponentInterface
{
    protected $clients;

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
        echo "✅ Socket ready" . "\n";
    }

    public function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn);
        echo "🟢 Client connected ({$conn->resourceId})" . "\n";
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        global $TO_HOME;
        #echo "📩 Message Received: {$msg}" . "\n";
        echo "📩 Message Received" . "\n";

        $data = json_decode($msg, true);
        if (isset($data['update']))
            file_put_contents("{$TO_HOME}/websocket/data.json", json_encode($data['update'], JSON_PRETTY_PRINT));

        // Broadcast the message to all other clients
        foreach ($this->clients as $client) {
            if ($client != $from) $client->send($msg);
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
        echo "🔴 Client disconnected ({$conn->resourceId})" . "\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "⚠️ Error: {$e->getMessage()}" . "\n";
        $conn->close();
    }
}

if (is_port_in_use($WS_PORT, true)) exit;

try {
    $app = new App("localhost", $WS_PORT);
    $app->route($WS_PATH, new WebSocket, ['*']);
    echo "🚀 Socket ACTIVE" . "\n";
    $app->run();
} catch (Exception $e) {
    echo "⚠️ Failed to start socket: " . $e->getMessage() . "\n";
}
