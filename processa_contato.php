<?php
// processa_contato.php
// Retorna sempre JSON
header('Content-Type: application/json; charset=utf-8');

try {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok'=>false,'error'=>'Método não permitido']); exit;
  }

  // Lê JSON do fetch()
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (!is_array($data)) { throw new Exception('Payload inválido'); }

  // Campos
  $nome     = trim($data['nome']     ?? '');
  $email    = trim($data['email']    ?? '');
  $assunto  = trim($data['assunto']  ?? '');
  $mensagem = trim($data['mensagem'] ?? '');
  $hp       = trim($data['website']  ?? ''); // honeypot

  // Honeypot simples
  if ($hp !== '') { throw new Exception('Bloqueado (honeypot)'); }

  // Validações mínimas
  if ($nome === '' || $assunto === '' || $mensagem === '') {
    throw new Exception('Preencha todos os campos obrigatórios.');
  }
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    throw new Exception('E-mail inválido.');
  }

  // Monta e-mail
  $para  = 'arthurcapos@gmail.com'; // <- DESTINO FIXO
  $titulo = '[CAS] ' . $assunto . ' — ' . $nome;

  $linhas = [];
  $linhas[] = "Nome: {$nome}";
  $linhas[] = "E-mail: {$email}";
  $linhas[] = "Assunto: {$assunto}";
  $linhas[] = "";
  $linhas[] = "Mensagem:";
  $linhas[] = $mensagem;
  $corpo = implode("\r\n", $linhas);

  // Cabeçalhos
  $host    = $_SERVER['HTTP_HOST'] ?? 'localhost';
  $fromDom = preg_replace('/[^a-z0-9\.\-]/i', '', $host);
  $from    = "no-reply@{$fromDom}";

  $headers = [];
  $headers[] = "MIME-Version: 1.0";
  $headers[] = "Content-Type: text/plain; charset=UTF-8";
  $headers[] = "From: CAS <{$from}>";
  $headers[] = "Reply-To: {$nome} <{$email}>";
  $headers[] = "X-Mailer: PHP/".phpversion();

  // Envia com mail() (rápido). OBS: pode cair no spam se o domínio não tiver SPF/DKIM.
  $ok = @mail($para, '=?UTF-8?B?'.base64_encode($titulo).'?=', $corpo, implode("\r\n",$headers));

  if (!$ok) {
    throw new Exception('Falha ao enviar. Verifique a configuração de e-mail do servidor.');
  }

  echo json_encode(['ok'=>true]);
} catch (Exception $e) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);
}
