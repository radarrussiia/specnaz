<?php
declare(strict_types=1);
// Run by hosting cron (recommended every minute). First run establishes baseline and sends no old messages.
$config=require __DIR__.'/push-config.php';
$isCli=(PHP_SAPI==='cli');
if(!$isCli){ header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); $key=(string)($_GET['key']??''); if(!hash_equals($config['cron_secret'],$key)){http_response_code(403);echo json_encode(['ok'=>false,'error'=>'forbidden']);exit;} }
function finish(array $data,int $status=200): never { if(PHP_SAPI!=='cli') http_response_code($status); echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES).(PHP_SAPI==='cli'?"\n":''); exit; }
if(!function_exists('curl_init')) finish(['ok'=>false,'error'=>'php_curl_extension_required'],500);
require __DIR__.'/push-lib.php';
// Include the existing fixed-source proxy, capturing its JSON response without creating a second parser.
ob_start(); include __DIR__.'/proxy.php'; $json=ob_get_clean(); $feed=json_decode($json?:'',true);
if(!is_array($feed)||empty($feed['ok'])||!is_array($feed['messages']??null)) finish(['ok'=>false,'error'=>'feed_unavailable','detail'=>'proxy.php did not return a valid message feed'],502);
$dir=$config['data_dir']; if(!is_dir($dir)&&!mkdir($dir,0700,true)&&!is_dir($dir)) finish(['ok'=>false,'error'=>'storage_unavailable'],500);
$stateFile=$dir.'/push-state.json'; $state=json_decode((string)@file_get_contents($stateFile),true); if(!is_array($state)) $state=[];
$ids=array_values(array_map(static fn($m)=>(string)($m['id']??''),$feed['messages'])); $ids=array_values(array_filter($ids));
if(empty($state['initialized'])) { file_put_contents($stateFile,json_encode(['initialized'=>true,'ids'=>array_slice($ids,0,1000),'updatedAt'=>gmdate('c')]),LOCK_EX); finish(['ok'=>true,'baseline'=>true,'sent'=>0,'note'=>'First run stores existing messages without notifying.']); }
$known=array_fill_keys((array)($state['ids']??[]),true); $fresh=array_values(array_filter($feed['messages'],static fn($m)=>is_array($m)&&!empty($m['id'])&&!isset($known[(string)$m['id']])));
$subs=json_decode((string)@file_get_contents($dir.'/push-subscriptions.json'),true); if(!is_array($subs)) $subs=[];
$sent=0;$expired=[];$errors=[];
foreach(array_slice(array_reverse($fresh),0,20) as $message){ $payload=['title'=>'🚨 Опасность!','body'=>substr((string)($message['text']??'Новое сообщение радара'),0,220),'tag'=>'specnaz-'.$message['id'],'id'=>(string)$message['id'],'url'=>'./']; foreach($subs as $i=>$sub){try{$code=sp_send_push($sub,$payload,$config); if($code===404||$code===410)$expired[$i]=true; elseif($code>=200&&$code<300)$sent++; else $errors[]='push_http_'.$code;}catch(Throwable $e){$errors[]=$e->getMessage();}} }
if($expired){$subs=array_values(array_filter($subs,static fn($s,$i)=>!isset($expired[$i]),ARRAY_FILTER_USE_BOTH));file_put_contents($dir.'/push-subscriptions.json',json_encode($subs,JSON_UNESCAPED_SLASHES),LOCK_EX);}
$newIds=array_values(array_unique(array_merge($ids,(array)($state['ids']??[])))); file_put_contents($stateFile,json_encode(['initialized'=>true,'ids'=>array_slice($newIds,0,1000),'updatedAt'=>gmdate('c')]),LOCK_EX);
finish(['ok'=>true,'newMessages'=>count($fresh),'subscriptions'=>count($subs),'pushAccepted'=>$sent,'errors'=>array_slice($errors,0,5),'updatedAt'=>gmdate('c')]);
