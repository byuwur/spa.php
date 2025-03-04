<?php
/* 
 * File: _common.php
 * Desc: Handles common initializations such as language and theme; it also includes project-wide common variables
 * Deps: /_var.php
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

// --- LANGUAGE ---
$lang = isset($_GET["lang"]) ? $_GET["lang"] : (isset($_COOKIE["lang"]) ? $_COOKIE["lang"] : "es");
switch ($lang) {
    case "es":
    case "en":
        $app_lang = $lang;
        break;
    default:
        $app_lang = "es";
        break;
}
if (isset($setLocalStorage) && $setLocalStorage) echo "<html lang='" . $app_lang . "' dir='ltr'>";
setcookie("lang", $app_lang, time() + 31536000, "/", "", false, false);
require_once $TO_HOME . "lang/" . $app_lang . ".php";

// --- THEME ---
$theme = isset($_GET["theme"]) ? $_GET["theme"] : (isset($_COOKIE["theme"]) ? $_COOKIE["theme"] : "dark");
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

// --- VARIABLES ---
$title_index = $_GET["title"] ?? 0;

$titles = [
    "SPA " . $home . " | byUwUr",
    "SPA " . $page . " | byUwUr"
];

$MATEUS_LINK = "https://byuwur.co";

$DNI_TYPES = [
    1 => "Número único de identificación personal (NUIP)",
    2 => "Registro civil (RC)",
    3 => "Tarjeta de identidad (TI)",
    4 => "Cédula de ciudadanía (CC)",
    5 => "Cédula de extranjería (CE)",
    6 => "Pasaporte (PS)",
    9 => "Otro..."
];

$BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

$DAYS_OF_WEEK = ["--- Seleccionar día de la semana ---", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

$MONTHS = ["--- Mes ---", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
