// desabafo.js (Adaptado para Supabase)
// O objeto 'supabase' agora é global e definido no bloco <script> do HTML.

let containerMensagens;
let formMensagem;
let formDesabafo;

// --- FUNÇÃO 1: CRIAR E EXIBIR UMA MENSAGEM NO MURAL ---
function exibirMensagem(texto) {
    const divMensagem = document.createElement('div');
    divMensagem.classList.add('mensagem-exemplo');

    const pTexto = document.createElement('p');
    pTexto.textContent = texto;

    const spanAnonimo = document.createElement('span');
    spanAnonimo.classList.add('anonimo');
    spanAnonimo.textContent = '- Anônimo, de coração para coração.';

    divMensagem.appendChild(pTexto);
    divMensagem.appendChild(spanAnonimo);

    if (containerMensagens) {
        // Usa prepend para garantir que as novas mensagens apareçam no topo
        containerMensagens.prepend(divMensagem);
    }
}

// --- FUNÇÃO 2: LER MENSAGENS E ATUALIZAR O MURAL ---

// Esta função faz a leitura e preenche o mural
async function atualizarMural() {
    // Requisita os 50 registros mais recentes da tabela 'mensagens'
    const { data, error } = await supabase
        .from('mensagens')
        .select('texto')
        .order('criado_em', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Erro ao carregar mensagens do Supabase: ", error);
        if (containerMensagens) {
            containerMensagens.innerHTML = '<p style="color: #FF7F7F; text-align: center;">Erro ao carregar o mural. Verifique a chave API e as Políticas RLS do Supabase.</p>';
        }
        return;
    }

    if (containerMensagens) {
        containerMensagens.innerHTML = ''; // Limpa o container
    }

    if (data.length === 0) {
        exibirMensagem("Seja a primeira pessoa a deixar uma mensagem de acolhimento!");
    } else {
        data.forEach(item => {
            exibirMensagem(item.texto);
        });
    }
}

// Esta função configura a escuta em tempo real
function configurarRealtime() {
    // Escuta em tempo real (Realtime) as mudanças na tabela 'mensagens'
    supabase
        .channel('public:mensagens')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens' }, payload => {
            // Qualquer mudança (inserção, atualização, exclusão) aciona o recarregamento
            atualizarMural();
        })
        .subscribe();
}


// --- FUNÇÃO DE INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', function () {
    // Buscamos os elementos
    containerMensagens = document.getElementById('container-mensagens');
    formMensagem = document.getElementById('form-mensagem');
    formDesabafo = document.getElementById('form-desabafo');

    // ----------------------------------------------------
    // --- FUNÇÃO 3: LIDAR COM O ENVIO DE NOVA MENSAGEM ---
    // ----------------------------------------------------
    if (formMensagem) {
        formMensagem.addEventListener('submit', async function (event) {
            event.preventDefault();

            const textarea = document.getElementById('mensagem-positiva');
            const novaMensagem = textarea.value.trim();

            if (novaMensagem && novaMensagem.length <= 300) {

                // Feedback visual para o usuário
                const btn = formMensagem.querySelector('button[type="submit"]');
                const btnText = btn.textContent;
                btn.textContent = 'Enviando...';
                btn.disabled = true;

                // Salva a mensagem no Supabase
                const { error } = await supabase
                    .from('mensagens')
                    .insert([
                        // O Supabase preencherá 'criado_em' e 'id' automaticamente
                        { texto: novaMensagem }
                    ]);

                if (error) {
                    console.error("Erro ao escrever no Supabase: ", error);
                    alert(`Ocorreu um erro: ${error.message}. Verifique suas Políticas RLS (Permissão "insert").`);
                } else {
                    textarea.value = ''; // Limpa o campo
                    alert('Sua mensagem de acolhimento foi publicada no mural! Obrigada!');
                    // O Realtime configurado acima cuida da atualização do mural
                }

                // Restaura o botão
                btn.textContent = btnText;
                btn.disabled = false;

            } else if (novaMensagem.length > 300) {
                alert('A mensagem de apoio deve ter no máximo 300 caracteres.');
            } else {
                alert('Por favor, escreva uma mensagem antes de publicar.');
            }
        });
    } else {
        console.error("ERRO CRÍTICO: O formulário de mensagem positiva não foi encontrado no HTML.");
    }

    // ----------------------------------------------------
    // --- LIDAR COM O ENVIO DO DESABAFO ------------------
    // ----------------------------------------------------
    if (formDesabafo) {
        formDesabafo.addEventListener('submit', function (event) {
            event.preventDefault();
            const textoDesabafo = document.getElementById('texto-desabafo').value.trim();

            if (textoDesabafo) {
                alert('Seu desabafo foi enviado. Esperamos que você se sinta um pouco mais leve.');
                document.getElementById('titulo-desabafo').value = '';
                document.getElementById('texto-desabafo').value = '';
            } else {
                alert('Por favor, escreva seu desabafo antes de enviar.');
            }
        });
    }

    // INICIA O MURAL (Primeiro carrega os dados e depois configura o realtime)
    atualizarMural();
    configurarRealtime();
});