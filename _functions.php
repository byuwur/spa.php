<?php
/*
 * File: _functions.php
 * Desc: Declares project-wide functions for multiple purposes
 * Deps: none
 * Copyright (c) 2024 Andrés Trujillo [Mateus] byUwUr
 */

// --- API functions ---

/** 
 * Sends a JSON response with status, error, message, and optional data, then terminates the script.
 * @param int $status HTTP status code.
 * @param bool $error Indicates if the response represents an error.
 * @param string $message Message to include in the response.
 * @param array $data Additional data to include in the response.
 */
function api_respond(int $status, bool $error, string $message, array $data = [])
{
    http_response_code($status);
    header("Content-Type: application/json");
    $response = new stdClass();
    $response->status = $status;
    $response->error = $error;
    $response->message = $message;
    $response->data = $data;
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    ob_end_flush();
    exit;
}

/** 
 * Makes an HTTP POST request to a given URL with optional GET and POST parameters.
 * @param string $url The URL to send the request to.
 * @param array $get GET parameters to include in the request.
 * @param array $post POST parameters to include in the request.
 * @return mixed The response from the request.
 */
function make_http_request(string $url, array $get = [], array $post = [])
{
    if (!validate_value($url, "url")) return console_error("CURL ERROR: Invalid URL.");
    global $SYSTEM_ROOT;
    session_write_close();
    $req = curl_init();
    $post[session_name()] = session_id();
    if (count($get)) $url = $url .  "?" . http_build_query($get);
    curl_setopt($req, CURLOPT_URL, $url);
    curl_setopt($req, CURLOPT_POST, 1);
    curl_setopt($req, CURLOPT_POSTFIELDS, http_build_query($post));
    curl_setopt($req, CURLOPT_VERBOSE, true);
    curl_setopt($req, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($req, CURLOPT_CAINFO, $SYSTEM_ROOT . "/cacert.pem");
    $requested = curl_exec($req);
    if (curl_errno($req)) {
        console_error("CURL HTTP2 (" . curl_getinfo($req, CURLINFO_HTTP_CODE) . ") ERROR: " . curl_error($req) . " = Switching to HTTP1.1");
        curl_setopt($req, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        $requested = curl_exec($req);
    }
    if (curl_errno($req)) console_error("CURL HTTP1.1 (" . curl_getinfo($req, CURLINFO_HTTP_CODE) . ") ERROR: " . curl_error($req));
    curl_close($req);
    session_start();
    return $requested;
}

/** 
 * Validates a value against a specified type, returning null if the value is invalid.
 * @param mixed $input The value to validate.
 * @param string $type The type to validate against (e.g., boolean, email).
 * @return mixed The validated value or null if invalid.
 */
function validate_value($input, string $type = "")
{
    if (!isset($input)) return null;
    if ($input === null) return null;
    if ($input === "null") return null;
    if ($input === "") return null;
    $filterMap = [
        "boolean" => FILTER_VALIDATE_BOOLEAN,
        "domain" => FILTER_VALIDATE_DOMAIN,
        "email" => FILTER_VALIDATE_EMAIL,
        "float" => FILTER_VALIDATE_FLOAT,
        "int" => FILTER_VALIDATE_INT,
        "ip" => FILTER_VALIDATE_IP,
        "mac" => FILTER_VALIDATE_MAC,
        "url" => FILTER_VALIDATE_URL
    ];
    return filter_var($input, $filterMap[$type] ?? FILTER_UNSAFE_RAW);
}

/** 
 * Sanitizes a value based on the specified type, removing harmful elements.
 * @param mixed $input The value to sanitize.
 * @param string $type The type of sanitization to apply (e.g., email, url).
 * @return mixed The sanitized value.
 */
function sanitize_value($input, string $type = "")
{
    $input = trim($input);
    $input = strip_tags($input);
    $input = htmlspecialchars($input);
    $filterMap = [
        "email" => FILTER_SANITIZE_EMAIL,
        "encoded" => FILTER_SANITIZE_ENCODED,
        "float" => FILTER_SANITIZE_NUMBER_FLOAT,
        "int" => FILTER_SANITIZE_NUMBER_INT,
        "special_chars" => FILTER_SANITIZE_FULL_SPECIAL_CHARS,
        "url" => FILTER_SANITIZE_URL
    ];
    return filter_var($input, $filterMap[$type] ?? FILTER_UNSAFE_RAW);
}

// --- COMMON & MISC functions ---

/**
 * Normalizes a string by removing non-alphanumeric characters, double spaces and converting to lowercase.
 * @param string $str The string to normalize.
 * @param string $mode Characters mode: uppercase, lowercase or leave it.
 * @param array $valid Special characters allowed in the string.
 * @return string The normalized string.
 */
function normalize_string(string $str, string $mode = "", array $valid = [])
{
    $str = preg_replace("/[^a-zA-Z0-9 " . implode("", $valid) . "]/", "", $str); // Remove non-alphanumeric characters except spaces
    $str = preg_replace("/\s+/", " ", $str); // Replace multiple spaces with a single space
    $str = trim($str); // Trim leading and trailing spaces
    switch (strtolower($mode)) {
        case "low":
        case "lower":
        case "lowercase":
            return strtolower($str); // Convert to lowercase
        case "up":
        case "upper":
        case "uppercase":
            return strtoupper($str); // Convert to uppercase
        default:
            return $str;
    }
}

/** 
 * Redirects the user to a specified location and terminates the script.
 * @param string $location The URL or path to redirect to.
 */
function change_location(string $location)
{
    http_response_code(307);
    header("Location: " . $location);
    exit;
}

/** 
 * Logs a message to the browser's console using JavaScript.
 * @param string $message The message to log.
 */
function console_log(string $message)
{
    echo "<script>console.log('" . $message . "');</script>";
}

/** 
 * Logs a warning message to the browser's console using JavaScript.
 * @param string $message The message to log.
 */
function console_warn(string $message)
{
    echo "<script>console.warn('" . $message . "');</script>";
}

/** 
 * Logs an error message to the browser's console using JavaScript.
 * @param string $message The message to log.
 */
function console_error(string $message)
{
    echo "<script>console.error('" . $message . "');</script>";
}

/** 
 * Triggers an error page and terminates the script.
 * @param int $status The HTTP status code to send.
 * @param string $message The error message to display.
 * @param string $error_file The path to the error file to include.
 */
function error_crash(int $status, string $message, string $error_file)
{
    console_warn("App crashed (" . $status . "): " . $message);
    $_GET["e"] = $status;
    $_POST["custom_error_message"] = $message;
    require_once $error_file;
    ob_end_flush();
    exit;
}

/** 
 * Suppresses all error reporting by setting error reporting level to 0 and disabling error display.
 */
function suppress_errors()
{
    error_reporting(0);
    ini_set("display_errors", 0);
}

/** 
 * Escapes HTML characters in a string to prevent XSS attacks.
 * @param mixed $input The input to escape.
 * @return string The escaped string, with newlines converted to <br> tags.
 */
function escape_html($input)
{
    $output = htmlspecialchars($input, ENT_QUOTES, "UTF-8", false);
    return nl2br($output);
}

/** 
 * Sends a JSON response and terminates the script.
 * @param mixed $json The data to encode and send as JSON.
 */
function exit_json($json)
{
    header("Content-Type: application/json");
    echo json_encode($json, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    ob_end_flush();
    exit;
}

/** 
 * Outputs data as a JSON-encoded string.
 * @param mixed $json The data to encode and print as JSON.
 */
function print_json($json)
{
    echo json_encode($json, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

/** 
 * Generates a random alphanumeric string of a specified length.
 * @param int $length The length of the random string.
 * @return string The generated random string.
 */
function random_string($length)
{
    $string = "";
    $char = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz";
    for ($i = 0; $i < $length; $i++) $string .= substr($char, rand(0, strlen($char)), 1);
    return $string;
}

/** 
 * Displays a Bootstrap modal with a customizable message and actions.
 * @param string $state The state of the modal (e.g., success, danger, info, warning).
 * @param string $title The title of the modal.
 * @param string $message The message to display in the modal.
 * @param bool $hideCancelBtn Whether to hide the cancel button.
 * @param string $redirect The URL to redirect to when "OK" is clicked.
 */
function show_modal_back($state = "success", $title = "INFO.", $message = "Message.", $hideCancelBtn = false, $redirect = "javascript:destroy_modal_back();")
{
    echo '<div id="modal_back" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel">
        <div id="modal_back_container" class="modal-dialog modal-dialog-scrollable">
            <div class="modal-content">
                <div id="modal_back_title" class="modal-header m-0 fs-5 alert alert-' . $state . '">' . $title . '</div>
                <div id="modal_back_body" class="modal-body text-dark">' . $message . '</div>
                <div class="modal-footer">
                    <a id="modal_back_back" class="btn btn-dark" href="javascript:destroy_modal_back();" onclick="javascript:destroy_modal_back();">CANCEL</a>
                    <a id="modal_back_ok" class="btn btn-success" href="' . $redirect . '">OK</a>
                </div>
            </div>
        </div>
    </div>
    <script>
    "use strict";
    function destroy_modal_back() {
        $("#modal_back").modal("hide");
        setTimeout(() => $("#modal_back").remove(), 999);
    }
    $(() => {
        ' . ($hideCancelBtn ? '$("#modal_back_back").addClass("d-none");' : '$("#modal_back_back").removeClass("d-none");') . '
        window.innerWidth < 992 ? $("#modal_back_container").addClass("modal-dialog-centered") : $("#modal_back_container").removeClass("modal-dialog-centered");
        $("#modal_back").modal("show");
    });
    </script>';
}

/** 
 * Returns the MIME type of a file based on its extension.
 * @param string $filename The name of the file.
 * @return string The MIME type of the file, or "application/octet-stream" if unknown.
 */
function get_mime_type($filename)
{
    $mime = [
        'aac' => 'audio/aac',
        'abw' => 'application/x-abiword',
        'arc' => 'application/octet-stream',
        'avi' => 'video/x-msvideo',
        'azw' => 'application/vnd.amazon.ebook',
        'bin' => 'application/octet-stream',
        'bmp' => 'image/bmp',
        'bz' => 'application/x-bzip',
        'bz2' => 'application/x-bzip2',
        'csh' => 'application/x-csh',
        'css' => 'text/css',
        'csv' => 'text/csv',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'eot' => 'application/vnd.ms-fontobject',
        'epub' => 'application/epub+zip',
        'gif' => 'image/gif',
        'htm' => 'text/html',
        'html' => 'text/html',
        'ico' => 'image/x-icon',
        'ics' => 'text/calendar',
        'jar' => 'application/java-archive',
        'jpeg' => 'image/jpeg',
        'jpg' => 'image/jpeg',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'mid' => 'audio/midi',
        'midi' => 'audio/midi',
        'mpeg' => 'video/mpeg',
        'mpkg' => 'application/vnd.apple.installer+xml',
        'odp' => 'application/vnd.oasis.opendocument.presentation',
        'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
        'odt' => 'application/vnd.oasis.opendocument.text',
        'oga' => 'audio/ogg',
        'ogv' => 'video/ogg',
        'ogx' => 'application/ogg',
        'otf' => 'font/otf',
        'png' => 'image/png',
        'pdf' => 'application/pdf',
        'ppt' => 'application/vnd.ms-powerpoint',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'rar' => 'application/x-rar-compressed',
        'rtf' => 'application/rtf',
        'sh' => 'application/x-sh',
        'svg' => 'image/svg+xml',
        'swf' => 'application/x-shockwave-flash',
        'tar' => 'application/x-tar',
        'tif' => 'image/tiff',
        'tiff' => 'image/tiff',
        'ts' => 'application/typescript',
        'ttf' => 'font/ttf',
        'txt' => 'text/plain',
        'vsd' => 'application/vnd.visio',
        'wav' => 'audio/x-wav',
        'weba' => 'audio/webm',
        'webm' => 'video/webm',
        'webp' => 'image/webp',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'xhtml' => 'application/xhtml+xml',
        'xls' => 'application/vnd.ms-excel',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xml' => 'application/xml',
        'xul' => 'application/vnd.mozilla.xul+xml',
        'zip' => 'application/zip',
        '3gp' => 'video/3gpp',
        '3g2' => 'video/3gpp2',
        '7z' => 'application/x-7z-compressed'
    ];
    $type = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    return $mime[$type] ?? "application/octet-stream";
}
