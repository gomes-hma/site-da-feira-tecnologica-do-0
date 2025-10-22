// script.js (Versão Definitiva - Conexão Otimizada)

// O "db" é definido no bloco <script> do index.html e é acessado globalmente aqui.

// A busca dos elementos HTML é feita DENTRO do DOMContentLoaded
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
        containerMensagens.prepend(divMensagem); 
    }
}

// --- FUNÇÃO 2: LER MENSAGENS DO FIREBASE E ATUALIZAR O MURAL (Em Tempo Real) ---
function carregarMensagens() {
    // Verificação da variável db (definida no index.html)
    if (typeof db === 'undefined' || !db) {
        console.error("ERRO CRÍTICO: Objeto 'db' do Firebase não encontrado. A conexão do Firebase falhou no index.html.");
        if (containerMensagens) {
            containerMensagens.innerHTML = '<p style="color: #F6C1C3; text-align: center;">ERRO: O sistema de mensagens não está conectado ao Firebase. Por favor, verifique suas credenciais no index.html e a criação do Firestore no console.</p>';
        }
        return;
    }
    
    // Escuta em tempo real as mudanças na coleção "mensagens"
    db.collection("mensagens").orderBy("criadoEm", "desc").limit(50)
        .onSnapshot((snapshot) => {
            if (containerMensagens) {
                containerMensagens.innerHTML = ''; // Limpa o container
            }
            
            snapshot.forEach(doc => {
                exibirMensagem(doc.data().texto);
            });

            if (snapshot.empty && containerMensagens) {
                exibirMensagem("Seja a primeira pessoa a deixar uma mensagem de acolhimento!");
            }
        }, (error) => {
            console.error("Erro ao carregar mensagens do Firestore: ", error);
            if (containerMensagens) {
                containerMensagens.innerHTML = '<p style="color: #F6C1C3; text-align: center;">Erro ao carregar o mural. Verifique as Regras de Segurança do Firestore.</p>';
            }
        });
}


// --- FUNÇÃO DE INICIALIZAÇÃO (GARANTE QUE TODOS OS ELEMENTOS EXISTAM) ---
document.addEventListener('DOMContentLoaded', function() {
    // Buscamos os elementos AGORA, quando temos certeza de que eles existem no DOM.
    containerMensagens = document.getElementById('container-mensagens');
    formMensagem = document.getElementById('form-mensagem');
    formDesabafo = document.getElementById('form-desabafo');

    // ----------------------------------------------------
    // --- FUNÇÃO 3: LIDAR COM O ENVIO DE NOVA MENSAGEM ---
    // ----------------------------------------------------
    if (formMensagem) {
        formMensagem.addEventListener('submit', function(event) {
            event.preventDefault(); // Impede o recarregamento da página

            const textarea = document.getElementById('mensagem-positiva');
            const novaMensagem = textarea.value.trim();

            if (novaMensagem && novaMensagem.length <= 300) {
                
                if (typeof db === 'undefined' || !db) {
                    alert('Erro de conexão: O banco de dados do Firebase não está ativo. Por favor, tente recarregar a página.');
                    return;
                }

                db.collection("mensagens").add({
                    texto: novaMensagem,
                    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    textarea.value = ''; // Limpa o campo
                    alert('Sua mensagem de acolhimento foi publicada no mural! Obrigada!');
                    // A exibição no mural é automática graças ao onSnapshot (carregarMensagens)
                })
                .catch((error) => {
                    console.error("Erro ao escrever no banco de dados: ", error);
                    alert(`Ocorreu um erro: ${error.message}. Verifique as Regras de Segurança do Firebase.`);
                });

            } else if (novaMensagem.length > 300) {
                alert('A mensagem de apoio deve ter no máximo 300 caracteres.');
            } else {
                alert('Por favor, escreva uma mensagem antes de publicar.');
            }
        });
    } else {
        console.error("ERRO CRÍTICO: O formulário de mensagem positiva (ID 'form-mensagem') não foi encontrado no HTML.");
    }
    
    // ----------------------------------------------------
    // --- LIDAR COM O ENVIO DO DESABAFO ------------------
    // ----------------------------------------------------
    if (formDesabafo) {
        formDesabafo.addEventListener('submit', function(event) {
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

    // INICIA O MURAL
    carregarMensagens();
});