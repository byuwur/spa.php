<?php
/* 
 * File: _common.php
 * Desc: Handles common initializations such as language and theme; it also includes project-wide common variables
 * Deps: /_var.php
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

// --- LANGUAGE ---
$lang = substr($_SERVER["HTTP_ACCEPT_LANGUAGE"] ?? "es", 0, 2);
if (isset($_COOKIE["lang"])) $lang = $_COOKIE["lang"];
if (isset($_GET["lang"])) $lang = $_GET["lang"];
switch ($lang) {
    case "es":
    case "en":
        $app_lang = $lang;
        break;
    default:
        $app_lang = "es";
        break;
}
setcookie("lang", $app_lang, time() + 31536000, "/", "", false, false);

// --- THEME ---
$theme = "dark";
if (isset($_COOKIE["theme"])) $theme = $_COOKIE["theme"];
if (isset($_GET["theme"])) $theme = $_GET["theme"];
switch ($theme) {
    case "dark":
    case "light":
        $app_theme = $theme;
        break;
    default:
        $app_theme = "dark";
        break;
}
setcookie("theme", $app_theme, time() + 31536000, "/", "", false, false);

// --- LOCAL STORAGE ---
if (isset($setLocalStorage) && $setLocalStorage) {
?>
    <html lang="<?= $app_lang ?>" dir="ltr">
    <script>
        localStorage.setItem("APP_LANG", "<?= $app_lang ?>");
        localStorage.setItem("APP_THEME", "<?= $app_theme ?>");
    </script>
<?php
}

// --- VARIABLES ---
$titles = [
    0 => "SPA.PHP | byUwUr"
];

$title_index = $_GET["title"] ?? 0;

$MATEUS_LINK = "https://byuwur.co";

$DNI_TYPES = [
    0 => "Inválido",
    1 => "Número único de identificación personal (NUIP)",
    2 => "Registro civil (RC)",
    3 => "Tarjeta de identidad (TI)",
    4 => "Cédula de ciudadanía (CC)",
    5 => "Cédula de extranjería (CE)",
    6 => "Pasaporte (PS)",
    9 => "Otro..."
];

$DNI_TYPES_SM = [
    0 => "[Inválido]",
    1 => "[NUIP]",
    2 => "[RC]",
    3 => "[TI]",
    4 => "[CC]",
    5 => "[CE]",
    6 => "[PS]",
    9 => "[...]"
];

$BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

$DAYS_OF_WEEK = ["--- Seleccionar día de la semana ---", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

$MONTHS = ["--- Mes ---", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
