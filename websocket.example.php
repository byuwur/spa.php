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
    <div class="container d-flex flex-column align-items-start justify-content-center text-white text-dark-shadow">
        <input id="ws_user" type="text" placeholder="Username" class="form-control text-no-shadow text-dark" style="max-width:240px;" />
        <button id="ws_send" class="btn btn-primary my-2" type="submit">WS SEND MESSAGE</button>
        <pre id="ws_messages" class="w-100 my-2" style="max-height:33vh;"></pre>
        <button id="ws_start" class="btn btn-primary my-2" type="submit">WS START</button>
        <pre id="ws_scripts" class="w-100 my-2" style="max-height:33vh;"></pre>
        <button id="ws_stop" class="btn btn-primary my-2" type="submit">WS STOP</button>
        <pre id="ws_log" class="w-100 my-2" style="max-height:33vh;"></pre>
    </div>
</div>
<script>
    $(() => {
        document.title = "<?= $titles[$title_index] ?>";
        byCommon.init();
        const ws = init_websocket({
            host: 'localhost',
            port: '6996',
            path: 'spa.ws',
            elementId: '#ws_log',
            logging: true,
            /*onOpen: () => {
                console.log('custom onOpen');
            },
            onClose: () => {
                console.log('custom onClose');
            },
            onError: () => {
                console.log('custom onError');
            },*/
            onMessage: (e) => {
                //console.log("custom onMessage", e);
                const $pre = $("<pre>").text(`${e?.data}`);
                $("#ws_messages").append($pre);
            },
        });
        $("#ws_send").off("click").on("click", function(e) {
            event.preventDefault();
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                console.warn("⚠️ Cannot send — socket not open");
                return;
            }
            const now = new Date().toISOString().replace("T", "_").replace(/:/g, "-").split(".")[0],
                msg = `${$("#ws_user").val()}: This message was sent at ${now}`;
            ws.send(msg);
        })
        element_make_http_request({
            $elementId: "#ws_start",
            $url: "<?= "{$HOME_PATH}/websocket/start.php" ?>",
            $trigger: "click",
            $returnType: "text",
            loudFail: false,
            doneFn: (data) => {
                $("#ws_scripts").append(data);
            },
            alwaysFn: () => {
                ws.retry();
            }
        });
        element_make_http_request({
            $elementId: "#ws_stop",
            $url: "<?= "{$HOME_PATH}/websocket/stop.php" ?>",
            $trigger: "click",
            $returnType: "text",
            loudFail: false,
            beforeFn: () => {
                ws.close();
            },
            doneFn: (data) => {
                $("#ws_scripts").append(data);
            }
        });
    });
</script>
<?php
while (ob_get_level() > 0) ob_end_flush();
?>