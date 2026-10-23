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
<link href="https://cdn.jsdelivr.net/gh/byuwur/easy-md-viewer@v1.8/md.min.css" rel="stylesheet" />
<link id="byVIEWtheme" href="https://cdn.jsdelivr.net/gh/byuwur/easy-md-viewer@v1.8/md.light.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/gh/byuwur/easy-md-viewer@v1.8/md.min.js"></script>
<style>
  ol {
    list-style: decimal-leading-zero !important;
  }
</style>
<div class="video-foreground app-container">
  <div class="container vh-100 d-flex flex-column align-items-center justify-content-center p-0">
    <pre id="byMDrenderer" class="w-100"></pre>
  </div>
</div>
<script>
  /*
   * Keep fragment-local declarations inside this callback.
   * SPA routes execute in the same document, so top-level const/let bindings
   * remain declared and cause redeclaration errors when a fragment loads again.
   */
  $(() => {
    const renderFetched = async (url, options = {}) => {
      try {
        const response = await fetch(url);
        if (!response.ok) console.warn("Something went wrong", response.statusText);
        byMDviewer(document.getElementById("byMDrenderer"), await response.text(), options);
      } catch (error) {
        console.warn("Something went wrong", error);
      }
    };
    renderFetched("https://raw.githubusercontent.com/byuwur/easy-md-viewer/main/test.md");
  });
</script>
<?php
while (ob_get_level() > 0)
  ob_end_flush();
?>