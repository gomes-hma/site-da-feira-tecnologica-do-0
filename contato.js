/* contato.js — página Contato (CAS) */
(function () {
  'use strict';

  // ========= Canais rápidos: configuração =========
  const CONTACTS = {
    email: 'arthurcapos@gmail.com',     // e-mail que aparecerá e abrirá no mailto
    whatsappNumber: '5511974140070',    // DDI+DDD+número, só dígitos
    whatsappMsg: 'Olá! Gostaria de falar sobre o projeto CAS.'
  };

  // Formata número BR para exibição
  function formatPhoneBR(numDigits) {
    const n = (numDigits || '').replace(/\D+/g, '');
    if (n.length === 13) { // +55 (11) 9xxxx-xxxx
      return `+${n.slice(0, 2)} (${n.slice(2, 4)}) ${n.slice(4, 9)}-${n.slice(9)}`;
    }
    if (n.length === 12) { // +55 (11) xxxx-xxxx
      return `+${n.slice(0, 2)} (${n.slice(2, 4)}) ${n.slice(4, 8)}-${n.slice(8)}`;
    }
    return `+${n}`; // fallback
  }

  // ========= Preenche atalhos do card "Canais rápidos" =========
  const emailLink = document.getElementById('emailLink');
  const waLink = document.getElementById('waLink');
  const btnMailto = document.getElementById('btnMailto');
  const btnWhats = document.getElementById('btnWhats');

  // E-mail do card
  if (emailLink) {
    emailLink.href = `mailto:${CONTACTS.email}`;
    emailLink.textContent = CONTACTS.email;
  }

  // WhatsApp (web + app)
  const phone = String(CONTACTS.whatsappNumber || '').replace(/\D+/g, '');
  const waWebURL = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(CONTACTS.whatsappMsg)}`;
  const waAppURL = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(CONTACTS.whatsappMsg)}`;

  // Link de texto no card
  if (waLink) {
    waLink.href = waWebURL;
    waLink.textContent = formatPhoneBR(phone); // ex.: +55 (11) 97414-0070
    waLink.setAttribute('aria-label', 'Abrir WhatsApp');
    waLink.setAttribute('rel', 'noopener');
    waLink.setAttribute('target', '_blank');
  }

  // Botões
  if (btnMailto) {
    const subject = 'Contato - Projeto CAS';
    btnMailto.href = `mailto:${CONTACTS.email}?subject=${encodeURIComponent(subject)}`;
  }

  if (btnWhats) {
    btnWhats.href = waWebURL;
    btnWhats.setAttribute('rel', 'noopener');
    btnWhats.setAttribute('target', '_blank');

    // No mobile, tenta abrir o app primeiro; se não abrir, cai no web
    btnWhats.addEventListener('click', function (e) {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        e.preventDefault();
        const start = Date.now();
        // tenta abrir o app
        window.location.href = waAppURL;
        // fallback pro web se o app não abrir
        setTimeout(() => {
          // se o app abriu, normalmente a aba perde foco/visibilidade
          if (document.visibilityState !== 'hidden') {
            window.open(waWebURL, '_blank');
          }
        }, 800);
      }
    });
  }

  // ========= Form: validação/UX =========
  const form = document.getElementById('formContato');
  const alertArea = document.getElementById('alertArea');
  const btnEnviar = document.getElementById('btnEnviar');
  const spinner = btnEnviar ? btnEnviar.querySelector('.spinner-border') : null;
  const website = document.getElementById('website'); // honeypot
  const mensagem = document.getElementById('mensagem');
  const charCount = document.getElementById('charCount');
  const startedAt = Date.now(); // time-trap simples

  // Contador de caracteres
  if (mensagem && charCount) {
    const updateCount = () => { charCount.textContent = `${mensagem.value.length}/2000`; };
    mensagem.addEventListener('input', updateCount);
    updateCount();
  }

  // Fallback para esconder o * quando válido (para browsers sem :has)
  (function () {
    const containers = [
      ...document.querySelectorAll('.form-floating'),
      ...document.querySelectorAll('.form-check')
    ];

    function updateFilledState() {
      containers.forEach(c => {
        const input = c.querySelector('input, textarea, select');
        const checked = input?.type === 'checkbox' ? input.checked : false;
        const valid = input ? input.checkValidity() : false;
        if (checked || valid) c.classList.add('is-filled');
        else c.classList.remove('is-filled');
      });
    }
    document.addEventListener('input', updateFilledState, true);
    document.addEventListener('change', updateFilledState, true);
    updateFilledState();
  })();

  // Salvar como .txt (funciona offline)
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contato_${sanitizeFilename(data.nome)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showAlert('Arquivo .txt gerado com sucesso!', 'success');
    });
  }

  // Envio do formulário
  if (form) {
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
      if (website && website.value.trim() !== '') {
        showAlert('Falha no envio.', 'danger');
        return;
      }
      if (Date.now() - startedAt < 1500) {
        showAlert('Aguarde um instante antes de enviar.', 'warning');
        return;
      }

      // Mostra spinner
      if (spinner) { spinner.classList.remove('d-none'); }
      btnEnviar.disabled = true;

      // Envio para o backend PHP (JSON)
      const data = getFormData();
      const payload = {
        nome: data.nome,
        email: data.email,
        assunto: data.assunto,
        mensagem: data.mensagem,
        website: document.getElementById('website')?.value || '' // honeypot
      };

      const ENDPOINT = 'processa_contato.php';

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(async (r) => {
          const text = await r.text(); // pode vir HTML/erro
          let res;
          try { res = JSON.parse(text); }
          catch { throw new Error(`Resposta inválida do servidor (HTTP ${r.status}). Conteúdo: ${text.slice(0, 120)}...`); }
          if (!r.ok || !res.ok) throw new Error(res?.error || `HTTP ${r.status}`);
          return res;
        })
        .then(() => {
          showAlert('Mensagem enviada com sucesso! Verifique o e-mail (inclusive o Spam).', 'success');
          form.reset();
          form.classList.remove('was-validated');
          if (charCount) charCount.textContent = `0/2000`;
        })
        .catch((err) => {
          console.error(err);

          // Fallback: abre o cliente de e-mail do usuário já preenchido
          try {
            const subject = `[CAS] ${data.assunto} — ${data.nome}`;
            const body =
              `Nome: ${data.nome}%0D%0A` +
              `E-mail: ${data.email}%0D%0A` +
              `Assunto: ${data.assunto}%0D%0A%0D%0A` +
              `Mensagem:%0D%0A${encodeURIComponent(data.mensagem)}`;
            window.location.href = `mailto:${CONTACTS.email}?subject=${encodeURIComponent(subject)}&body=${body}`;
          } catch (_) {}

          showAlert(`Não foi possível enviar pelo servidor. Detalhe: ${err.message}`, 'danger');
        })
        .finally(() => {
          if (spinner) { spinner.classList.add('d-none'); }
          btnEnviar.disabled = false;
        });

    }, false);
  }

  // ========= Helpers =========
  function getFormData() {
    return {
      nome: document.getElementById('nome')?.value.trim() || '',
      email: document.getElementById('email')?.value.trim() || '',
      assunto: document.getElementById('assunto')?.value || '',
      mensagem: document.getElementById('mensagem')?.value.trim() || ''
    };
  }

  function showAlert(message, type = 'info') {
    const area = alertArea;
    if (!area) return;
    area.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${escapeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    area.style.display = 'block';
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
