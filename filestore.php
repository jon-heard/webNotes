<?php
declare(strict_types=1);

/**
 * File storage API. Every requested dir is one direct child of BASE_DIR.
 * POST action=list   dir=<dir> [extension=<ext>] -> {success,files:[names]}
 * POST action=save   dir=<dir> filename=<name> content=<text> -> {success,bytes}
 * POST action=load   dir=<dir> filename=<name> -> {success,content}
 * POST action=delete dir=<dir> filename=<name> -> {success}
 * POST action=rename dir=<dir> oldFilename=<name> newFilename=<name> -> {success}
 */

const BASE_DIR = __DIR__;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['txt', 'json', 'nts', 'ypj'];

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function fail(int $status, string $error): never
{
    respond($status, ['success' => false, 'error' => $error]);
}

function validFilename(mixed $name): bool
{
    if (!is_string($name) || !preg_match('/^[A-Za-z0-9][A-Za-z0-9._ -]{0,254}$/', $name)) {
        return false;
    }
    return in_array(strtolower(pathinfo($name, PATHINFO_EXTENSION)), ALLOWED_EXTENSIONS, true);
}

function resolveDir(mixed $subdir): ?string
{
    if ($subdir === null || $subdir === '' || $subdir === '.') {
        return BASE_DIR;
    }
    if (!is_string($subdir) || str_contains($subdir, '..') ||
        !preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/', $subdir)) {
        return null;
    }
    return BASE_DIR . DIRECTORY_SEPARATOR . $subdir;
}

function validateProjectContent(string $content): void
{
    $project = json_decode($content, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($project) ||
        !isset($project['files']) || !is_array($project['files'])) {
        fail(400, 'invalid_project');
    }
    foreach ($project['files'] as $file) {
        if (!is_array($file) || !isset($file['filename'], $file['content']) ||
            !is_string($file['filename']) || !is_string($file['content']) ||
            $file['filename'] === '' || $file['filename'] === '.' || $file['filename'] === '..' ||
            strlen($file['filename']) > 255 || preg_match('/[\x00-\x1F\x7F\/\\\\]/', $file['filename'])) {
            fail(400, 'invalid_project_file');
        }
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail(405, 'method_not_allowed');
}

// Keep browser writes same-origin, matching the former index.php save route.
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$requestHost = $_SERVER['HTTP_HOST'] ?? '';
if ($requestOrigin !== '' && $requestHost !== '' &&
    strcasecmp((string)parse_url($requestOrigin, PHP_URL_HOST), preg_replace('/:\\d+$/', '', $requestHost)) !== 0) {
    fail(403, 'cross_origin_rejected');
}
if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
    fail(403, 'cross_origin_rejected');
}

$action = $_POST['action'] ?? '';
$rawBody = file_get_contents('php://input');
if (is_string($rawBody) && strlen($rawBody) > 12 * 1024 * 1024) {
    fail(413, 'request_too_large');
}
$request = is_string($rawBody) ? json_decode($rawBody, true) : null;
if (!is_array($request)) {
    $request = $_POST;
}
$action = $request['action'] ?? $action;
$dir = resolveDir($request['dir'] ?? '');
if ($dir === null) {
    fail(400, 'invalid_dir');
}

switch ($action) {
    case 'list':
        $extension = strtolower(ltrim((string)($request['extension'] ?? ''), '.'));
        if ($extension !== '' && !preg_match('/^[A-Za-z0-9]{1,10}$/', $extension)) {
            fail(400, 'invalid_extension');
        }
        if (!is_dir($dir)) {
            respond(200, ['success' => true, 'files' => []]);
        }
        $files = [];
        foreach (new DirectoryIterator($dir) as $entry) {
            if (!$entry->isFile()) continue;
            $name = $entry->getFilename();
            if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9._ -]{0,254}$/', $name)) continue;
            if ($extension !== '' && strtolower(pathinfo($name, PATHINFO_EXTENSION)) !== $extension) continue;
            $files[] = $name;
        }
        sort($files, SORT_NATURAL | SORT_FLAG_CASE);
        respond(200, ['success' => true, 'files' => $files]);

    case 'save':
        $filename = $request['filename'] ?? '';
        $content = $request['content'] ?? null;
        if (!validFilename($filename)) fail(400, 'invalid_filename');
        if (!is_string($content)) fail(400, 'missing_content');
        if (strlen($content) > MAX_BYTES) fail(413, 'content_too_large');
        if (strtolower(pathinfo($filename, PATHINFO_EXTENSION)) === 'ypj') {
            validateProjectContent($content);
        }
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            fail(500, 'storage_unavailable');
        }
        $path = $dir . DIRECTORY_SEPARATOR . $filename;
        $tmp = tempnam($dir, '.tmp_');
        if ($tmp === false) fail(500, 'write_failed');
        $written = file_put_contents($tmp, $content, LOCK_EX);
        if ($written !== strlen($content) || !@rename($tmp, $path)) {
            @unlink($tmp);
            fail(500, 'write_failed');
        }
        chmod($path, 0644);
        respond(200, ['success' => true, 'bytes' => $written]);

    case 'load':
        $filename = $request['filename'] ?? '';
        if (!validFilename($filename)) fail(400, 'invalid_filename');
        $path = $dir . DIRECTORY_SEPARATOR . $filename;
        if (!is_file($path)) fail(404, 'not_found');
        $content = file_get_contents($path);
        if ($content === false) fail(500, 'read_failed');
        respond(200, ['success' => true, 'content' => $content]);

    case 'delete':
        $filename = $request['filename'] ?? '';
        if (!validFilename($filename)) fail(400, 'invalid_filename');
        $path = $dir . DIRECTORY_SEPARATOR . $filename;
        if (!is_file($path)) fail(404, 'not_found');
        if (!unlink($path)) fail(500, 'delete_failed');
        respond(200, ['success' => true]);

    case 'rename':
        $oldFilename = $request['oldFilename'] ?? '';
        $newFilename = $request['newFilename'] ?? '';
        if (!validFilename($oldFilename) || !validFilename($newFilename)) fail(400, 'invalid_filename');
        if (strtolower(pathinfo($oldFilename, PATHINFO_EXTENSION)) !== strtolower(pathinfo($newFilename, PATHINFO_EXTENSION))) {
            fail(400, 'extension_mismatch');
        }
        $oldPath = $dir . DIRECTORY_SEPARATOR . $oldFilename;
        $newPath = $dir . DIRECTORY_SEPARATOR . $newFilename;
        if (!is_file($oldPath)) fail(404, 'not_found');
        if (file_exists($newPath)) fail(409, 'already_exists');
        if (!rename($oldPath, $newPath)) fail(500, 'rename_failed');
        respond(200, ['success' => true]);

    default:
        fail(400, 'invalid_action');
}
