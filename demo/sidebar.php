<?php
require_once "./_init.php";
require_once "{$TO_HOME}/../_functions.php";
require_once "{$TO_HOME}/../_common.php";
//require_once "{$TO_HOME}/../_plugins.php";
//require_once "{$TO_HOME}/../_config.php";
require_once "{$TO_HOME}/_routes.php";
//require_once "{$TO_HOME}/../_router.php";
//require_once "{$TO_HOME}/../_auth.php";
// --- PHP ---
require_once "{$TO_HOME}/common.example.php";
//enable_progressive_rendering();
?>
<nav id="bywr-sidebar" class="bywr-sidebar accordion bywr-accordion bg-dark-transparent bg-blurred text-white">
  <div class="overlay"></div>
  <div class="bywr-sidebar-header">
    <div class="navbar-brand has-background-contain" role="img"
      aria-label="<?= escape_html($LANG["sidebar.logo_alt"]) ?>"
      style="height:48px;width:48px;background-image:url('<?= "{$HOME_PATH}/../img/byuwur.png" ?>');">
    </div>
    <span class="ms-2 me-4 pe-5">byuwur/spa.php</span>
  </div>
  <div class="bywr-sidebar-content accordion-item bywr-sidebar-options">
    <a class="bywr-sidebar-option" href="<?= "/{$ROUTE_HOME}" ?>">
      <i class="fas fa-home"></i> <span><?= escape_html($LANG["nav.home"]) ?></span><i class="fas fa-angle-right ms-auto"></i>
    </a>
    <a class="bywr-sidebar-option" href="<?= "/{$ROUTE_PAGE}" ?>">
      <i class="fas fa-dice-one"></i> <span><?= escape_html($LANG["nav.page"]) ?></span><i class="fas fa-angle-right ms-auto"></i>
    </a>
    <a class="bywr-sidebar-option" href="<?= "/{$ROUTE_VIDEO}" ?>">
      <i class="fas fa-video"></i> <span><?= escape_html($LANG["nav.video"]) ?></span><i class="fas fa-angle-right ms-auto"></i>
    </a>
    <a class="bywr-sidebar-option" href="<?= "/{$ROUTE_JSON}" ?>">
      <i class="fas fa-code"></i> <span><?= escape_html($LANG["nav.json"]) ?></span><i class="fas fa-angle-right ms-auto"></i>
    </a>
    <a class="bywr-sidebar-option" href="<?= "/{$ROUTE_MD}" ?>">
      <i class="fas fa-laptop-code"></i> <span><?= escape_html($LANG["nav.md"]) ?></span><i class="fas fa-angle-right ms-auto"></i>
    </a>
    <a class="bywr-sidebar-option" href="<?= "/{$ROUTE_ERROR}" ?>">
      <i class="fas fa-bug"></i> <span><?= escape_html($LANG["nav.error"]) ?></span><i class="fas fa-angle-right ms-auto"></i>
    </a>
  </div>
  <div class="bywr-sidebar-content accordion-item flex-grow-0">
    <button class="accordion-header accordion-button p-2o5 collapsed" data-bs-toggle="collapse"
      data-bs-target="#lang-drop" aria-expanded="false" aria-controls="lang-drop">
      <i class="fas fa-language"></i><span><?= escape_html($LANG["language.selector"]) ?></span>
    </button>
    <div id="lang-drop" class="accordion-collapse collapse bg-dark-transparent" data-bs-parent="#bywr-sidebar">
      <div class="d-flex flex-row">
        <a class="bywr-sidebar-option" href="<?= "/{$ROUTE_ES}" ?>" title="<?= escape_html($LANG["language.spanish"]) ?>">
          <img class="inline-logo" src="img/co.svg" alt="<?= escape_html($LANG["language.spanish"]) ?>" />
          ES<i class="fas fa-angle-right ms-auto"></i>
        </a>
        <a class="bywr-sidebar-option" href="<?= "/{$ROUTE_EN}" ?>" title="<?= escape_html($LANG["language.english"]) ?>">
          <img class="inline-logo" src="img/gb.svg" alt="<?= escape_html($LANG["language.english"]) ?>" />
          EN<i class="fas fa-angle-right ms-auto"></i>
        </a>
      </div>
      <!--a class="bywr-sidebar-option" href="javascript:;"><i class="fas fa-home"></i>Home<i class="fas fa-angle-right ms-auto"></i></a-->
    </div>
    <p class="m-0 p-2 border-top" style="font-size: 0.75rem;">&copy; <?= date("Y") ?> <a
        href="<?= $MATEUS_LINK ?>">[Mateus]
        byUwUr</a>.
      <?= escape_html($LANG["footer.rights"]) ?><br><?= escape_html($LANG["footer.made_with"]) ?> <i class="fas fa-heart" aria-hidden="true"></i>
      <?= escape_html($LANG["footer.by"]) ?> <a href="<?= escape_html($MATEUS_LINK) ?>" target="_blank">[Mateus] byUwUr</a>
    </p>
  </div>
  <a id="bywr-sidebar-toggle" class="bywr-sidebar-toggle" href="javascript:;" title="<?= escape_html($LANG["sidebar.toggle"]) ?>" aria-label="<?= escape_html($LANG["sidebar.toggle"]) ?>"
    data-bs-toggle="tooltip" data-bs-title="<?= escape_html($LANG["sidebar.toggle"]) ?>">
    <i class="fas fa-bars"></i><span><?= escape_html($LANG["sidebar.menu"]) ?></span>
  </a>
  <div id="bywr-sidebar-hidden" class="bywr-sidebar-hidden">
    <div class="navbar-brand has-background-contain mt-auto" role="img"
      aria-label="<?= escape_html($LANG["sidebar.logo_alt"]) ?>"
      style="height:48px;width:48px;background-image:url('<?= "{$HOME_PATH}/../img/byuwur.png" ?>');">
    </div>
  </div>
</nav>
<?php
while (ob_get_level() > 0)
  ob_end_flush();
?>