<?php
/* 
 * File: _plugins.php
 * Desc: Handles invokation and initialization of the composer libraries
 * Deps: /_var.php
 * Copyright (c) 2024 Andrés Trujillo [Mateus] byUwUr
 */

require_once $TO_HOME . "vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($TO_HOME);
$dotenv->load();
