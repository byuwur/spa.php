<?php
$input = $_GET["test"] ?? "demo";
$sha224 = hash("sha224", $input);
$sha256 = hash("sha256", $input);
$sha384 = hash("sha384", $input);
$sha512 = hash("sha512", $input);
$sha3_224 = hash("sha3-224", $input);
$sha3_256 = hash("sha3-256", $input);
$sha3_384 = hash("sha3-384", $input);
$sha3_512 = hash("sha3-512", $input);
$pw_hash = password_hash($input, PASSWORD_BCRYPT);

echo "Input: \"" . $input . "\""
    . "<br>SHA-224 = " . strlen($sha224) . " : " . $sha224
    . "<br>SHA-256 = " . strlen($sha256) . " : " . $sha256
    . "<br>SHA-384 = " . strlen($sha384) . " : " . $sha384
    . "<br>SHA-512 = " . strlen($sha512) . " : " . $sha512
    . "<br>SHA3-224 = " . strlen($sha3_224) . " : " . $sha3_224
    . "<br>SHA3-256 = " . strlen($sha3_256) . " : " . $sha3_256
    . "<br>SHA3-384 = " . strlen($sha3_384) . " : " . $sha3_384
    . "<br>SHA3-512 = " . strlen($sha3_512) . " : " . $sha3_512
    . "<br>BCRYPT = " . strlen($pw_hash) . " : " . $pw_hash
    . "<br>password_verify() = " . (password_verify("demo", $pw_hash) ? "true" : "false");
