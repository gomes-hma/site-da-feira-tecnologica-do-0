<?php

date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // permite chamada de http://127.0.0.1:3000 etc.
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

try {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok'=>false,'error'=>'Método não permitido']); exit;
  }

  $raw  = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (!is_array($data)) { throw new Exception('Payload inválido'); }

  $nome     = trim($data['nome']     ?? '');
  $email    = trim($data['email']    ?? '');
  $assunto  = trim($data['assunto']  ?? '');
  $mensagem = trim($data['mensagem'] ?? '');
  $hp       = trim($data['website']  ?? '');

  if ($hp !== '')                          { throw new Exception('Bloqueado (honeypot)'); }
  if ($nome === '' || $assunto === '' || $mensagem === '') {
    throw new Exception('Preencha todos os campos obrigatórios.');
  }
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    throw new Exception('E-mail inválido.');
  }

  $para   = 'arthurcapos@gmail.com'; 
  $titulo = '[CAS] ' . $assunto . ' — ' . $nome;

  $corpo = "Nome: $nome\r\nE-mail: $email\r\nAssunto: $assunto\r\n\r\nMensagem:\r\n$mensagem\r\n\r\n--\r\nEnviado em ".date('d/m/Y H:i')." (IP ".($_SERVER['REMOTE_ADDR']??'').")";

  $host    = $_SERVER['HTTP_HOST'] ?? 'localhost';
  $fromDom = preg_replace('/[^a-z0-9\.\-]/i', '', $host);
  $from    = "no-reply@{$fromDom}";

  $headers  = "MIME-Version: 1.0\r\n";
  $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
  $headers .= "From: CAS <{$from}>\r\n";
  $headers .= "Reply-To: {$nome} <{$email}>\r\n";
  $headers .= "X-Mailer: PHP/".phpversion()."\r\n";

  $ok1 = @mail($para, '=?UTF-8?B?'.base64_encode($titulo).'?=', $corpo, $headers);

  
  $ackHeaders  = "MIME-Version: 1.0\r\n";
  $ackHeaders .= "Content-Type: text/plain; charset=UTF-8\r\n";
  $ackHeaders .= "From: CAS <{$from}>\r\n";
  @mail($email, '=?UTF-8?B?'.base64_encode('Recebemos sua mensagem - CAS').'?=',
        "Olá $nome,\r\n\r\nRecebemos sua mensagem e responderemos em breve.\r\n\r\nCópia:\r\n---------------------\r\n$corpo",
        $ackHeaders);

  if (!$ok1) { throw new Exception('Falha ao enviar (mail() indisponível no host).'); }

  echo json_encode(['ok'=>true]);
} catch (Exception $e) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);
}
