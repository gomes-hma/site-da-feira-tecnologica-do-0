/* contato.js — página Contato (CAS) */
(function () {
  'use strict';

  // ========= Canais rápidos =========
  const CONTACTS = {
    email: 'projetocasetecmcm@gmail.com', // apenas exibição e fallback mailto
  };

  // Preenche o card "Canais rápidos"
  const emailLink = document.getElementById('emailLink');
  const btnMailto = document.getElementById('btnMailto');
  if (emailLink) {
    emailLink.href = `mailto:${CONTACTS.email}`;
    emailLink.textContent = CONTACTS.email;
  }
  if (btnMailto) {
    const subject = 'Contato - Projeto CAS';
    btnMailto.href = `mailto:${CONTACTS.email}?subject=${encodeURIComponent(subject)}`;
  }

  // ========= Form: variáveis =========
  const form       = document.getElementById('formContato');
  const alertArea  = document.getElementById('alertArea');
  const btnEnviar  = document.getElementById('btnEnviar');
  const spinner    = btnEnviar ? btnEnviar.querySelector('.spinner-border') : null;
  const mensagem   = document.getElementById('mensagem');
  const charCount  = document.getElementById('charCount');
  const honeypot   = document.getElementById('website'); // campo invisível anti-bot

  // Contador de caracteres
  if (mensagem && charCount) {
    const updateCount = () => (charCount.textContent = `${mensagem.value.length}/2000`);
    mensagem.addEventListener('input', updateCount);
    updateCount();
  }

  // Esconder * quando o campo estiver válido (fallback p/ browsers sem :has)
  (function () {
    const containers = [
      ...document.querySelectorAll('.form-floating'),
      ...document.querySelectorAll('.form-check'),
    ];
    function updateFilledState() {
      containers.forEach(c => {
        const input   = c.querySelector('input, textarea, select');
        const checked = input?.type === 'checkbox' ? input.checked : false;
        const valid   = input ? input.checkValidity() : false;
        if (checked || valid) c.classList.add('is-filled');
        else c.classList.remove('is-filled');
      });
    }
    document.addEventListener('input',  updateFilledState, true);
    document.addEventListener('change', updateFilledState, true);
    updateFilledState();
  })();

  // ========= Salvar como .txt (funciona offline) =========
  const btnSalvarTxt = document.getElementById('btnSalvarTxt');
  if (btnSalvarTxt) {
    btnSalvarTxt.addEventListener('click', () => {
      if (!form.checkValidity()) {
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
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `contato_${sanitizeFilename(data.nome)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showAlert('Arquivo .txt gerado com sucesso!', 'success');
    });
  }

  // ========= Envio do formulário =========
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // validação HTML5
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      showAlert('Preencha todos os campos obrigatórios.', 'warning');
      return;
    }
    // honeypot anti-bot
    if (honeypot && honeypot.value.trim() !== '') {
      showAlert('Não foi possível enviar agora.', 'danger');
      return;
    }

    if (spinner) spinner.classList.remove('d-none');
    btnEnviar.disabled = true;

    const data = getFormData();

    try {
      // Envio via Formspree — troque o endpoint se precisar
      const res = await fetch('https://formspree.io/f/xvgvpryr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          nome: data.nome,
          email: data.email,
          assunto: data.assunto,
          mensagem: data.mensagem
        })
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Erro ${res.status}: ${t.slice(0,120)}`);
      }

      showAlert('Mensagem enviada com sucesso! Verifique seu e-mail (inclusive o spam).', 'success');
      form.reset();
      if (charCount) charCount.textContent = '0/2000';
      form.classList.remove('was-validated');

    } catch (err) {
      console.error(err);
      showAlert('Não foi possível enviar agora. Abriremos seu cliente de e-mail…', 'danger');

      // Fallback: abre o mailto já preenchido
      const subject = `[CAS] ${data.assunto} — ${data.nome}`;
      const body =
        `Nome: ${data.nome}%0D%0A` +
        `E-mail: ${data.email}%0D%0A` +
        `Assunto: ${data.assunto}%0D%0A%0D%0A` +
        `Mensagem:%0D%0A${encodeURIComponent(data.mensagem)}`;
      window.location.href = `mailto:${CONTACTS.email}?subject=${encodeURIComponent(subject)}&body=${body}`;

    } finally {
      if (spinner) spinner.classList.add('d-none');
      btnEnviar.disabled = false;
    }
  });

  // ========= Helpers =========
  function getFormData() {
    return {
      nome:     document.getElementById('nome')?.value.trim()     || '',
      email:    document.getElementById('email')?.value.trim()    || '',
      assunto:  document.getElementById('assunto')?.value         || '',
      mensagem: document.getElementById('mensagem')?.value.trim() || ''
    };
  }

  function showAlert(message, type = 'info') {
    if (!alertArea) return;
    alertArea.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${escapeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    alertArea.style.display = 'block';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }

  function sanitizeFilename(name) {
    return (name || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .slice(0, 40) || 'contato';
  }
})();
