<?php
require_once "./_var.php";
require_once $TO_HOME . "_common.php";
//require_once $TO_HOME . "_functions.php";
//require_once $TO_HOME . "_plugins.php";
//require_once $TO_HOME . "_config.php";
require_once $TO_HOME . "_routes.php";
//require_once $TO_HOME . "_router.php";
//require_once $TO_HOME . "_auth.php";
// --- PHP ---
?>
<nav id="bywr-sidebar" class="bywr-sidebar accordion bywr-accordion bg-dark-transparent bg-blurred text-white">
    <div class="overlay"></div>
    <div class="bywr-sidebar-content accordion-item flex-grow-1">
        <div class="bywr-sidebar-option p-2o5">
            <div class="navbar-brand has-background-contain" style="height:48px;width:48px;background-image:url('<?= $HOME_PATH; ?>/img/byuwur.png');"></div>
            <span class="ms-2 me-4 pe-5">spa.php</span>
        </div>
        <a class="bywr-sidebar-option" href="<?= $ROOT_ROUTE . $_home; ?>">
            <i class="fas fa-home"></i><span><?= $home; ?></span><i class="fas fa-angle-right ms-auto"></i>
        </a>
        <a class="bywr-sidebar-option" href="<?= $ROOT_ROUTE . $_page1; ?>">
            <i class="fas fa-dice-one"></i><span><?= $page1; ?></span><i class="fas fa-angle-right ms-auto"></i>
        </a>
        <a class="bywr-sidebar-option" href="<?= $ROOT_ROUTE . $_page2; ?>">
            <i class="fas fa-dice-two"></i><span><?= $page2; ?></span><i class="fas fa-angle-right ms-auto"></i>
        </a>
        <a class="bywr-sidebar-option" href="<?= $ROOT_ROUTE; ?>error">
            <i class="fas fa-bug"></i><span>Error</span><i class="fas fa-angle-right ms-auto"></i>
        </a>
    </div>
    <div class="bywr-sidebar-content accordion-item flex-grow-0">
        <button class="accordion-header accordion-button p-2o5 collapsed" data-bs-toggle="collapse" data-bs-target="#lang-drop" aria-expanded="false" aria-controls="lang-drop">
            <i class="fas fa-earth-americas"></i><span>Idiomas/Languages:</span>
        </button>
        <div id="lang-drop" class="accordion-collapse collapse bg-dark-transparent" data-bs-parent="#bywr-sidebar">
            <div class="d-flex flex-row">
                <a class="bywr-sidebar-option" href="<?= $ROOT_ROUTE; ?>es" title="Español"><img src="img/co.png" width="16px" height="12px" style="margin: 4px;" alt="" /> ES<i class="fas fa-angle-right ms-auto"></i></a>
                <a class="bywr-sidebar-option" href="<?= $ROOT_ROUTE; ?>en" title="English"><img src="img/uk.png" width="16px" height="12px" style="margin: 4px;" alt="" /> EN<i class="fas fa-angle-right ms-auto"></i></a>
            </div>
            <!--a class="bywr-sidebar-option" href="javascript:;"><i class="fas fa-home"></i>Home<i class="fas fa-angle-right ms-auto"></i></a-->
        </div>
        <p class="m-0 p-2 border-top" style="font-size: 0.75rem;">&copy; <?= date("Y"); ?> <a href="<?= $MATEUS_LINK; ?>">[Mateus] byUwUr</a>. Derechos reservados.<br>Hecho con<i class="fas fa-heart" aria-hidden="true"></i>por <a href="<?= $MATEUS_LINK; ?>" target="_blank">[Mateus] byUwUr</a></p>
    </div>
    <a id="bywr-sidebar-toggle" class="bywr-sidebar-toggle" href="javascript:;" title="Alternar menu lateral"><i class="fas fa-bars"></i><span>menu</span></a>
    <div id="bywr-sidebar-hidden" class="bywr-sidebar-hidden">
        <div class="navbar-brand has-background-contain mt-auto" style="height:48px;width:48px;background-image:url('<?= $HOME_PATH; ?>/img/byuwur.png');"></div>
    </div>
</nav>
<?php
// Always call due to /_var.php invoking ob_start();
ob_end_flush();
?>