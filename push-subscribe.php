<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function out(int $status, array $data): never { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(405, ['ok'=>false,'error'=>'method_not_allowed']);
if (empty($_SERVER['HTTPS']) && (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') !== 'https')) out(400, ['ok'=>false,'error'=>'https_required']);
$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 16384) out(413, ['ok'=>false,'error'=>'invalid_payload_size']);
$sub = json_decode($raw, true);
if (!is_array($sub) || !is_string($sub['endpoint'] ?? null) || !is_array($sub['keys'] ?? null)) out(400, ['ok'=>false,'error'=>'invalid_subscription']);
$endpoint = $sub['endpoint']; $url = parse_url($endpoint);
if (!$url || strtolower((string)($url['scheme'] ?? '')) !== 'https' || empty($url['host']) || filter_var($url['host'], FILTER_VALIDATE_IP)) out(400, ['ok'=>false,'error'=>'invalid_endpoint']);
$p256dh = (string)($sub['keys']['p256dh'] ?? ''); $auth = (string)($sub['keys']['auth'] ?? '');
$decode = static function(string $s): string|false { return base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s)%4)%4), true); };
$pub = $decode($p256dh); $authBytes = $decode($auth);
if ($pub === false || strlen($pub) !== 65 || $pub[0] !== "\x04" || $authBytes === false || strlen($authBytes) < 16 || strlen($authBytes) > 32) out(400, ['ok'=>false,'error'=>'invalid_subscription_keys']);
$config = require __DIR__.'/push-config.php';
$dir = $config['data_dir']; if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) out(500,['ok'=>false,'error'=>'storage_unavailable']);
$file = $dir.'/push-subscriptions.json'; $fp = fopen($file, 'c+'); if (!$fp) out(500,['ok'=>false,'error'=>'storage_unavailable']);
flock($fp, LOCK_EX); $contents = stream_get_contents($fp); $all = json_decode($contents ?: '[]', true); if (!is_array($all)) $all=[];
$all = array_values(array_filter($all, static fn($x)=>is_array($x) && ($x['endpoint'] ?? '') !== $endpoint));
if (count($all) >= 1000) { flock($fp,LOCK_UN); fclose($fp); out(429,['ok'=>false,'error'=>'subscription_limit']); }
$all[] = ['endpoint'=>$endpoint,'keys'=>['p256dh'=>$p256dh,'auth'=>$auth],'createdAt'=>gmdate('c')];
rewind($fp); ftruncate($fp,0); fwrite($fp,json_encode($all,JSON_UNESCAPED_SLASHES)); fflush($fp); flock($fp,LOCK_UN); fclose($fp);
out(200,['ok'=>true,'saved'=>true]);
