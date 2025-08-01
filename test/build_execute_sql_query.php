<?php
require_once "../_var.php";
require_once "{$TO_HOME}/_functions.php";
require_once "{$TO_HOME}/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($TO_HOME);
$dotenv->load();
//$mysqli = new mysqli("localhost", "root", "", "testing", "3306");
//if ($mysqli->connect_errno) die("Connection failed: " . $mysqli->connect_errno . " = " . $mysqli->connect_error);
// $_GET is used as the WHERE clause
$_GET["id"] = 1;
$_GET["name"] = 2;
$_GET["value"] = 3;
// $valid are the values admited in function
// so if $_GET has something else than the defined array its ignored
$valid = [
    "id" => ["column" => "ID", "type" => "i"],
    "name" => ["column" => "NAME", "type" => "s"],
    "value" => ["column" => "VALUE", "type" => "s"]
];
// $_POST must always have "data"
// $_POST["data"] is an array of the modifications intended on script
// INSERT can admit multiple rows in bulk,
// UPDATE shouldn't have multiple rows, due to $_GET that acts as where
$_POST["data"] = [
    ["id" => "1", "name" => "2", "value" => "3"],
    ["id" => "2", "name" => "3", "value" => "1"]
];
// $fields are similar to valid but with $_POST
$fields = ["id", "name", "value"];
// $joins are intended to complement WHERE in very specific scenarios
// if you have the option to make another request instead of using these... do
$joins = [
    ["join_type" => "JOIN", "join_table" => "roles", "join_columns" => ["id" => ["condition" => "=", "custom" => "usuarios_ID"]]]
];
// $nested, whether rare, can be used in hand with $_GET to check values
// with subqueries, can be a bit underperforming if you DB grows too much, but:
// if you have the option to make another request instead of using these... do
$nested = [
    "id" => ["condition" => "IN", "custom" => "( SELECT ID FROM test WHERE ID = ? ORDER BY ID DESC )"],
];
$FULLbq = build_sql_query("R", "*", "test", $fields, $_GET, " ORDER BY ID ASC", $valid, $_POST["data"] ?? [], $nested, $joins);
$Cbq = build_sql_query("C", "", "test", $fields, $_GET, "", ["id" => ["column" => "ID", "type" => "i"], "name" => ["column" => "NAME", "type" => "s"], "value" => ["column" => "VALUE", "type" => "s"]]);
$Rbq = build_sql_query("R", "*", "test", $fields, $_GET, " ORDER BY ID ASC", ["id" => ["column" => "ID", "type" => "i"], "name" => ["column" => "NAME", "type" => "s", "condition" => "LIKE"]]);
$Ubq = build_sql_query("U", "", "test", $fields, $_GET, "", ["id" => ["column" => "ID", "type" => "i"], "name" => ["column" => "NAME", "type" => "s"], "value" => ["column" => "VALUE", "type" => "s"]]);
$Dbq = build_sql_query("D", "", "test", $fields, $_GET, "", ["id" => ["column" => "ID", "type" => "i"]]);
//exit_json([$FULLbq, $Cbq, $Rbq, $Ubq, $Dbq]);
//exit_json([$FULLbq, $Rbq]);
//exit_json($Rbq);
if (!isset($_GET["test"])) exit_json([]);
if ($_GET["test"] == "c") $bq = $Cbq;
if ($_GET["test"] == "r") $bq = $Rbq;
if ($_GET["test"] == "u") $bq = $Ubq;
if ($_GET["test"] == "d") $bq = $Dbq;
$sql = execute_sql_query($mysqli, $bq->query, $bq->param_types, $bq->param_values, $fields, $_POST["data"] ?? [], $valid);
$mysqli->close();
api_respond($sql->status, $sql->error, $sql->message, $sql->data);
