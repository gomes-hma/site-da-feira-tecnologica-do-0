/* contato.js — formulário de contato sem backend (demonstração local para feira) */

(function(){
  'use strict';

  // Configura seus canais aqui (ajuste antes da feira):
  const CONTACTS = {
    email: 'cas@exemplo.com',                  // e-mail exibido/used no mailto
    whatsappNumber: '5511999999999',          // DDI+DDD+número, só dígitos
    whatsappMsg: 'Olá! Gostaria de falar sobre o projeto CAS.'
  };

  // Links diretos (preenchidos a partir da config)
  const emailLink = document.getElementById('emailLink');
  const waLink = document.getElementById('waLink');
  const btnMailto = document.getElementById('btnMailto');
  const btnWhats = document.getElementById('btnWhats');

  if(emailLink){
    emailLink.href = `mailto:${CONTACTS.email}`;
    emailLink.textContent = CONTACTS.email;
  }
  const waURL = `https://wa.me/${CONTACTS.whatsappNumber}?text=${encodeURIComponent(CONTACTS.whatsappMsg)}`;
  if(waLink) waLink.href = waURL;
  if(btnWhats) btnWhats.href = waURL;
  if(btnMailto) btnMailto.href = `mailto:${CONTACTS.email}`;

  // Validação Bootstrap
  const form = document.getElementById('formContato');
  const alertArea = document.getElementById('alertArea');
  const btnEnviar = document.getElementById('btnEnviar');
  const spinner = btnEnviar?.querySelector('.spinner-border');
  const website = document.getElementById('website'); // honeypot
  const mensagem = document.getElementById('mensagem');
  const charCount = document.getElementById('charCount');
  const startedAt = Date.now(); // time-trap simples

  if(mensagem && charCount){
    const updateCount = () => {
      charCount.textContent = `${mensagem.value.length}/2000`;
    };
    mensagem.addEventListener('input', updateCount);
    updateCount();
  }

  // Salvar como .txt (para demonstração local)
  const btnSalvarTxt = document.getElementById('btnSalvarTxt');
  if(btnSalvarTxt){
    btnSalvarTxt.addEventListener('click', () => {
      if(!form.checkValidity()){
        form.classList.add('was-validated');
        showAlert('Preencha os campos obrigatórios antes de salvar.', 'warning');
        return;
      }
      const data = getFormData();
      const content = [
        `Nome: ${data.nome}`,
        `E-mail: ${data.email}`,
        `Assunto: ${data.assunto}`,
        `Mensagem:`,
        `${data.mensagem}`
      ].join('\n');
      const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contato_${sanitizeFilename(data.nome)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showAlert('Arquivo .txt gerado com sucesso!', 'success');
    });
  }

  if(form){
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();

      // Validação visual
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        showAlert('Revise os campos destacados e tente novamente.', 'warning');
        return;
      }

      // Anti-spam simples
      if(website && website.value.trim() !== ''){
        showAlert('Falha no envio.', 'danger');
        return;
      }
      if(Date.now() - startedAt < 1500){
        showAlert('Aguarde um instante antes de enviar.', 'warning');
        return;
      }

      // Mostra spinner
      if(spinner){ spinner.classList.remove('d-none'); }
      btnEnviar.disabled = true;

      // Modo demonstração: abrir mailto com os dados
      const data = getFormData();
      const subject = `[CAS] ${data.assunto} — ${data.nome}`;
      const body = `Nome: ${data.nome}%0D%0AE-mail: ${data.email}%0D%0AAssunto: ${data.assunto}%0D%0A%0D%0AMensagem:%0D%0A${encodeURIComponent(data.mensagem)}`;
      const mailtoHref = `mailto:${CONTACTS.email}?subject=${encodeURIComponent(subject)}&body=${body}`;

      // Tenta abrir o cliente de e-mail
      window.location.href = mailtoHref;

      // Feedback amigável
      setTimeout(() => {
        if(spinner){ spinner.classList.add('d-none'); }
        btnEnviar.disabled = false;
        form.reset();
        form.classList.remove('was-validated');
        if(charCount) charCount.textContent = `0/2000`;
        showAlert('Abrimos seu cliente de e-mail com a mensagem preenchida. Revise e envie por lá. 😉', 'success');
      }, 600);
    }, false);
  }

  function getFormData(){
    return {
      nome: document.getElementById('nome')?.value.trim() || '',
      email: document.getElementById('email')?.value.trim() || '',
      assunto: document.getElementById('assunto')?.value || '',
      mensagem: document.getElementById('mensagem')?.value.trim() || ''
    };
  }

  function showAlert(message, type='info'){
    if(!alertArea) return;
    alertArea.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
    alertArea.style.display = 'block';
  }

  function escapeHtml(str){
    return str.replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[m]));
  }

  function sanitizeFilename(name){
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,40) || 'contato';
  }
})();