<?php
$_GET["title"] = "home";
require_once "./_var.php";
require_once $TO_HOME . "_common.php";
//require_once $TO_HOME . "_functions.php";
//require_once $TO_HOME . "_plugins.php";
//require_once $TO_HOME . "_config.php";
//require_once $TO_HOME . "_routes.php";
//require_once $TO_HOME . "_router.php";
//require_once $TO_HOME . "_auth.php";
// --- PHP ---
require_once $TO_HOME . "common.php";
?>
<div class="video-foreground app-container">
    <div class="container vh-100 d-flex flex-column align-items-center justify-content-center">
        <div class="text-white text-dark-shadow">
            <p><?= $description; ?></p>
            <p><?= $thisis . " " . $home; ?>.</p>
            <p><?= $home . ": "; ?><b><i>"<?= $home_desc; ?>"</i></b></p>
            <hr class="w-100" />
            <p>Video Demo:</p>
        </div>
        <video id="subtitle-sample" class="video-js w-100" poster="<?= $HOME_PATH; ?>/img/video/sample.jpg" controls playsinline>
            <source src="<?= $HOME_PATH; ?>/img/video/sample.mp4" type="video/mp4" />
            <track src="<?= $HOME_PATH; ?>/img/video/sample.en.vtt" kind="captions" srclang="en" label="English" default />
            <track src="<?= $HOME_PATH; ?>/img/video/sample.es.vtt" kind="captions" srclang="es" label="Español" />
        </video>
    </div>
</div>
<script>
    $(() => {
        document.title = "<?= $titles[$title_index]; ?>";
        byCommon.init();

        const byVideoPlayer = videojs("subtitle-sample", {
            controls: true,
            autoplay: false,
            preload: 'auto',
            fluid: true,
            playbackRates: [0.5, 1, 1.5, 2],
            controlBar: {
                currentTimeDisplay: true,
                timeDivider: true,
                durationDisplay: true,
                remainingTimeDisplay: true,
                progressControl: true,
                fullscreenToggle: true,
                pictureInPictureToggle: true,
                playbackRateMenuButton: true,
                chaptersButton: true,
                volumePanel: {
                    inline: false
                },
            }
        });
    });
</script>
<?php
// Always call due to /_var.php invoking ob_start();
ob_end_flush();
?>