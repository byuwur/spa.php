<?php
// MUST require_once "/_var.php"
require_once $TO_HOME . "vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($TO_HOME);
$dotenv->load();