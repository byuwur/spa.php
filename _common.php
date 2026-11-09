<?php
/* 
 * File: _common.php
 * Desc: Handles common initializations such as language and theme; it also includes project-wide common variables
 * Deps: /_init.php, /_functions.php
 * Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr
 */

// --- LANGUAGE ---
// An explicit query wins over the saved cookie, then the browser language.
$lang = $_GET["lang"] ?? $_COOKIE["lang"] ?? substr($_SERVER["HTTP_ACCEPT_LANGUAGE"] ?? "es", 0, 2);
$APP_LANG = in_array($lang, ["es", "en", "ja"], true) ? $lang : "es";
setcookie("lang", $APP_LANG, time() + 31536000, "/", "", false, false);

// --- THEME ---
$theme = $_GET["theme"] ?? $_COOKIE["theme"] ?? "dark";
$APP_THEME = in_array($theme, ["dark", "light"], true) ? $theme : "dark";
setcookie("theme", $APP_THEME, time() + 31536000, "/", "", false, false);

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
