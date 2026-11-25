<?php
require_once "./_init.php";
require_once "{$TO_HOME}/../_functions.php";
require_once "{$TO_HOME}/../_common.php";
//require_once "{$TO_HOME}/../_plugins.php";
//require_once "{$TO_HOME}/../_config.php";
//require_once "{$TO_HOME}/_routes.php";
//require_once "{$TO_HOME}/../_router.php";
//require_once "{$TO_HOME}/../_auth.php";
// ===== DEMO CONFIGURATION =====
require_once "{$TO_HOME}/common.example.php";
// === PHP ===
//enable_progressive_rendering();
?>
<link href="https://cdn.jsdelivr.net/gh/byuwur/json.view@latest/json.min.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/gh/byuwur/json.view@latest/json.min.js" defer></script>
<div class="video-foreground app-container">
  <div class="container vh-100 d-flex flex-column align-items-center justify-content-center p-0">
    <pre id="byJSONrenderer" class="w-100" data-theme="light"></pre>
  </div>
</div>
<script>
  /*
   * Keep fragment-local declarations inside this callback.
   * SPA routes execute in the same document, so top-level const/let bindings
   * remain declared and cause redeclaration errors when a fragment loads again.
   */
  $(async () => {
    const container = document.getElementById("byJSONrenderer");
    if (!container) return;
    try {
      const response = await fetch("https://raw.githubusercontent.com/byuwur/json.view/main/test.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const source = await response.json();
      // A navigation can replace the fragment while its sample is downloading.
      if (container.isConnected) byJSONviewer(container, source, {
        chunkSize: 1,
        chunkLatency: 10
      });
    } catch (error) {
      if (container.isConnected) console.warn("Could not load the JSON sample", error);
    }
  });
</script>
<?php
while (ob_get_level() > 0)
  ob_end_flush();
?>