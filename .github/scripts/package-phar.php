<?php
/**
 * File: package-phar.php
 * Desc: Packages the reusable framework in a native PHP archive with a read-only public asset endpoint.
 * Run only during a release build with phar.readonly=0; runtime PHP does not need that setting.
 */
if (PHP_SAPI !== "cli") {
  http_response_code(404);
  exit;
}
if ($argc !== 3) {
  fwrite(STDERR, "Use package-phar.php <staged framework directory> <output.phar>\n");
  exit(1);
}
$directory = realpath($argv[1]);
if (!$directory || dirname($argv[2]) !== $directory)
  throw new RuntimeException("The archive output must stay inside the staging directory.");
$archive = new Phar($argv[2]);
$archive->startBuffering();
$archive->setSignatureAlgorithm(Phar::SHA256);
$public = [];
$mimes = ["js" => "text/javascript", "css" => "text/css", "png" => "image/png", "jpg" => "image/jpeg", "jpeg" => "image/jpeg", "gif" => "image/gif", "webp" => "image/webp", "svg" => "image/svg+xml", "ico" => "image/x-icon", "woff" => "font/woff", "woff2" => "font/woff2", "ttf" => "font/ttf", "eot" => "application/vnd.ms-fontobject"];
foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS)) as $entry) {
  if (!$entry->isFile() || $entry->getFilename() === basename($argv[2]))
    continue;
  $name = str_replace("\\", "/", substr($entry->getPathname(), strlen($directory) + 1));
  $archive->addFile($entry->getPathname(), $name);
  $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
  if (isset($mimes[$extension]))
    $public[$name] = $mimes[$extension];
}
$publicCode = var_export($public, true);
$stub = <<<'STUB'
<?php
/** [EXPERIMENTAL] Reusable SPA.php framework. Include this file; keep your application in its own folder. */
Phar::mapPhar();

/** @return string Native read-only archive path for require_once and framework-owned assets. */
function byspa_framework_path(): string
{
  return "phar://" . __FILE__;
}

if (realpath($_SERVER["SCRIPT_FILENAME"] ?? "") === __FILE__) {
  $requested = $_GET["asset"] ?? ltrim(rawurldecode($_SERVER["PATH_INFO"] ?? ""), "/");
  $asset = is_string($requested) ? $requested : "";
  $public = __PUBLIC_FILES__;
  if ($asset === "_error.php") {
    require byspa_framework_path() . "/_error.php";
    exit;
  }
  if (!isset($public[$asset])) {
    http_response_code(404);
    header("Content-Type: text/plain; charset=UTF-8");
    echo "Framework asset not found. Include this file from your application; open demo/ for the example.";
    exit;
  }
  header("Content-Type: " . $public[$asset]);
  header("X-Content-Type-Options: nosniff");
  $bytes = file_get_contents(byspa_framework_path() . "/" . $asset);
  header("Content-Length: " . strlen($bytes));
  echo $bytes;
  exit;
}
__HALT_COMPILER();
STUB;
$archive->setStub(str_replace("__PUBLIC_FILES__", $publicCode, $stub));
$archive->stopBuffering();
