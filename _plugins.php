<?php
/* 
 * File: _plugins.php
 * Desc: Handles invokation and initialization of the composer libraries
 * Deps: /_var.php
 * Copyright (c) 2025 Andrés Trujillo [Mateus] byUwUr
 */

/*
Please consider if you require_once THIS file,
it isn't going to access the vendor/autoload from SPA.php
but the one on the root of your project due to _var.php
*/
if (file_exists($TO_HOME . "vendor/autoload.php")) require_once $TO_HOME . "vendor/autoload.php";
