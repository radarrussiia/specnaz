<?php
declare(strict_types=1);

/**
 * Спецназ — same-origin JSON feed proxy.
 * Fetches the public message list from the fixed upstream source and returns
 * normalized messages. No arbitrary URL parameter is accepted (SSRF guard).
 * Requires PHP cURL. DOM is used when available; a constrained regex fallback
 * supports the current article/time/p HTML layout if DOM is unavailable.
 */
const SPECNAZ_SOURCE_URL = 'https://parsertgtovknews.ru/max/map.php';
const SPECNAZ_MAX_MESSAGES = 100;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

function specnaz_json_error(int $status, string $code, string $detail = ''): never {
    http_response_code($status);
    $out = ['ok' => false, 'error' => $code];
    if ($detail !== '') $out['detail'] = $detail;
    echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function specnaz_fetch_source(): string {
    if (!function_exists('curl_init')) {
        specnaz_json_error(500, 'php_curl_extension_required', 'Enable PHP cURL in hosting settings.');
    }
    $ch = curl_init(SPECNAZ_SOURCE_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_USERAGENT => 'SpecnazPWA-FeedProxy/1.0 (+same-origin JSON feed)',
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_ENCODING => '',
    ]);
    $body = curl_exec($ch);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $type = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);
    if ($body === false || $errno !== 0) {
        specnaz_json_error(502, 'upstream_fetch_failed', $error ?: ('cURL error ' . $errno));
    }
    if ($status < 200 || $status >= 300) {
        specnaz_json_error(502, 'upstream_http_error', 'HTTP ' . $status);
    }
    if (strlen($body) > 5 * 1024 * 1024) {
        specnaz_json_error(502, 'upstream_response_too_large');
    }
    if (stripos($type, 'text/html') === false && stripos($body, '<article') === false) {
        specnaz_json_error(502, 'unexpected_upstream_format', 'Expected the source message-list HTML.');
    }
    return $body;
}

function specnaz_plain(string $html): string {
    $html = preg_replace('~<br\s*/?>~i', "\n", $html) ?? $html;
    $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/[\x{00a0}\s]+/u', ' ', $text) ?? $text;
    return trim($text);
}

function specnaz_priority(string $text): string {
    return preg_match('/опасност|тревог|срочно|ракетн|ударн|беспилот|бпла|бэк|укрыт|отбой/iu', $text) ? 'high' : 'normal';
}

function specnaz_add_message(array &$messages, string $datetime, string $text): void {
    $text = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
    if ($text === '') return;
    $timestamp = $datetime !== '' ? strtotime($datetime) : false;
    $idSource = ($datetime !== '' ? $datetime : 'no-date') . "\n" . $text;
    $messages[] = [
        'id' => hash('sha256', $idSource),
        'text' => $text,
        'datetime' => $datetime,
        'timestamp' => $timestamp === false ? null : $timestamp,
        'priority' => specnaz_priority($text),
        'source' => 'parsertgtovknews.ru',
    ];
}

function specnaz_parse_dom(string $html): array {
    $previous = libxml_use_internal_errors(true);
    $doc = new DOMDocument();
    $loaded = $doc->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);
    if (!$loaded) return [];
    $xpath = new DOMXPath($doc);
    $articles = $xpath->query('//article');
    $messages = [];
    if ($articles === false) return [];
    foreach ($articles as $article) {
        $timeNodes = (new DOMXPath($doc))->query('.//time', $article);
        $textNodes = (new DOMXPath($doc))->query('.//p', $article);
        $datetime = '';
        if ($timeNodes && $timeNodes->length) {
            $time = $timeNodes->item(0);
            if ($time instanceof DOMElement) $datetime = trim($time->getAttribute('datetime'));
        }
        $text = '';
        if ($textNodes && $textNodes->length) $text = trim((string)$textNodes->item(0)->textContent);
        specnaz_add_message($messages, $datetime, $text);
    }
    return $messages;
}

function specnaz_parse_regex(string $html): array {
    $messages = [];
    if (!preg_match_all('~<article\b[^>]*>(.*?)</article>~is', $html, $articles)) return [];
    foreach ($articles[1] as $article) {
        $datetime = '';
        if (preg_match('~<time\b[^>]*\bdatetime=["\']([^"\']*)["\'][^>]*>~i', $article, $m)) {
            $datetime = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
        $text = '';
        if (preg_match('~<p\b[^>]*>(.*?)</p>~is', $article, $m)) $text = specnaz_plain($m[1]);
        specnaz_add_message($messages, $datetime, $text);
    }
    return $messages;
}

try {
    $html = specnaz_fetch_source();
    $messages = class_exists('DOMDocument') ? specnaz_parse_dom($html) : specnaz_parse_regex($html);
    if (!$messages) {
        specnaz_json_error(502, 'no_messages_parsed', 'The source HTML structure may have changed.');
    }
    usort($messages, static function(array $a, array $b): int {
        return ((int)($b['timestamp'] ?? 0)) <=> ((int)($a['timestamp'] ?? 0));
    });
    $messages = array_slice($messages, 0, SPECNAZ_MAX_MESSAGES);
    echo json_encode([
        'ok' => true,
        'source' => SPECNAZ_SOURCE_URL,
        'fetchedAt' => gmdate('c'),
        'count' => count($messages),
        'messages' => $messages,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
} catch (Throwable $e) {
    error_log('[Specnaz proxy] ' . $e->getMessage());
    specnaz_json_error(500, 'proxy_internal_error');
}
