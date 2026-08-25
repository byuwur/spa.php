<?php
require_once "./_init.php";
require_once "{$TO_HOME}/../_functions.php";
require_once "{$TO_HOME}/../_common.php";
//require_once "{$TO_HOME}/../_plugins.php";
//require_once "{$TO_HOME}/../_config.php";
//require_once "{$TO_HOME}/_routes.php";
//require_once "{$TO_HOME}/../_router.php";
//require_once "{$TO_HOME}/../_auth.php";
// --- PHP ---
require_once "{$TO_HOME}/common.example.php";
//enable_progressive_rendering();
?>
<link href="https://cdn.jsdelivr.net/gh/byuwur/easy-json-viewer@v2.5.final/json.min.css" rel="stylesheet" />
<link id="byVIEWtheme" href="https://cdn.jsdelivr.net/gh/byuwur/easy-json-viewer@v2.5.final/json.light.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/gh/byuwur/easy-json-viewer@v2.5.final/json.min.js"></script>
<div class="video-foreground app-container">
  <div class="container vh-100 d-flex flex-column align-items-center justify-content-center p-0">
    <pre id="byJSONrenderer" class="w-100"></pre>
  </div>
</div>
<script>
  /*
   * Keep fragment-local declarations inside this callback.
   * SPA routes execute in the same document, so top-level const/let bindings
   * remain declared and cause redeclaration errors when a fragment loads again.
   */
  $(() => {
    const renderFetched = (e, n = {}) => { fetch(e).then(e => (e.ok || console.warn("Something went wrong", e.statusText), e.json())).then(e => { byJSONviewer(document.getElementById("byJSONrenderer"), e, n) }).catch(e => { console.warn("Something went wrong", e) }) };
    renderFetched("https://raw.githubusercontent.com/byuwur/easy-json-viewer/main/test.json", { chunkSize: 1, chunkLatency: 10 });
  });
</script>
<?php
while (ob_get_level() > 0)
  ob_end_flush();
?>