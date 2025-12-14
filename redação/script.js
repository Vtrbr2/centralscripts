// === CONFIGURAÇÃO E CONSTANTES ===
const config = {
    ENABLE_SUBMISSION: false,
    LOGIN_URL: 'https://sedintegracoes.educacao.sp.gov.br/credenciais/api/LoginCompletoToken',
    API_BASE_URL: 'https://edusp-api.ip.tv',
    Ocp_Apim_Subscription_Key: '2b03c1db3884488795f79c37c069381a',
    USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    GEMINI_API_KEYS: [
        'AIzaSyBm19Mf_N3Zb-uZOYF3UDvsnrtGVUjaUBk',
        'AIzaSyBPD0aDJArOiG1-qNmM1BUkNIDyqxIb-fw',
        'AIzaSyCiI2FUcOz_055I2ZrQ05IuIoqNmiZGV2Y',
        'AIzaSyBI0tP3ZG_ax2wW1Ivw8zbLWmMzMEDYjJM',
        'AIzaSyD6uxZZbrXSHhrm3Ysg_WvNWMtLGIGfndE',
        'AIzaSyAxSURXv2pKciZSFjxbNrvdYDx1Y6US1CU',
        'AIzaSyD9EoMlVzBY_Y1efyVKyL90QlySshnrnZI'
    ]
};

// === VARIÁVEIS GLOBAIS ===
let trava = false;
let currentFetchedRedacoes = [];
let selectedRedacaoId = null;
let currentAuthToken = null;
let userNick = null;

// === ELEMENTOS DA DOM (ATUALIZADOS) ===
const senhaInput = document.getElementById("password");
const raInput = document.getElementById("studentId");
const searchRedacaoBtn = document.getElementById('loginNormal');
const redacaoSelectionModal = document.getElementById('redacaoSelectionModal');
const redacaoListContainer = document.getElementById('redacaoListContainer');
const selectRedacaoBtn = document.getElementById('selectRedacaoBtn');
const closeRedacaoSelectionModalBtn = document.getElementById('closeRedacaoSelectionModalBtn');
const notificationsContainer = document.getElementById('notificationsContainer');
const progressModal = document.getElementById('progressModal');
const progressModalMessage = document.getElementById('progressModalMessage');
const minTimeInput = document.getElementById('min-time');
const maxTimeInput = document.getElementById('max-time');
const verifyBtn = document.getElementById('verifyBtn');
const statusText = document.getElementById('statusText');
const spinner = document.getElementById('spinner');
const togglePassword = document.getElementById('togglePassword');
const clearStudentId = document.getElementById('clearStudentId');
const clearPassword = document.getElementById('clearPassword');
const loginForm = document.getElementById('loginForm');

// === FUNÇÕES DE UTILIDADE ===
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `Notificacao ${type}`;
    notification.innerHTML = `<p>${message}</p>`;
    notificationsContainer.prepend(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    notification.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });

    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

async function makeRequest(url, method = 'GET', headers = {}, body = null) {
    const options = { method, headers: { 'User-Agent': config.USER_AGENT, ...headers } };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
    return response.json();
}

function isRedacao(task) {
    return task.tags?.some(t => t.toLowerCase().includes('redacao')) || 
           task.title?.toLowerCase().includes('redação');
}

// === LÓGICA DE VERIFICAÇÃO (QUADRADINHO) ===
verifyBtn.addEventListener('click', () => {
    verifyBtn.style.display = 'none';
    spinner.style.display = 'inline-block';
    statusText.textContent = 'Verificando…';
    
    setTimeout(() => {
        spinner.style.display = 'none';
        verifyBtn.style.display = 'inline-block';
        verifyBtn.classList.add('checked');
        statusText.textContent = '✅ Verificado';
        searchRedacaoBtn.disabled = false;
    }, 2000);
});

// === LÓGICA DO OLHO DA SENHA ===
togglePassword.addEventListener('click', () => {
    const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
    senhaInput.setAttribute('type', type);
    togglePassword.textContent = type === 'password' ? '👁' : '🔒';
});

// === BOTÕES DE LIMPAR CAMPOS ===
raInput.addEventListener('input', () => {
    clearStudentId.classList.toggle('hidden', !raInput.value);
});

senhaInput.addEventListener('input', () => {
    clearPassword.classList.toggle('hidden', !senhaInput.value);
});

clearStudentId.addEventListener('click', () => {
    raInput.value = '';
    clearStudentId.classList.add('hidden');
    raInput.focus();
});

clearPassword.addEventListener('click', () => {
    senhaInput.value = '';
    clearPassword.classList.add('hidden');
    senhaInput.focus();
});

// === LÓGICA PRINCIPAL DO SISTEMA DE REDAÇÃO ===
searchRedacaoBtn.addEventListener('click', async () => {
    if (trava || !raInput.value || !senhaInput.value) {
        showNotification('Preencha RA e senha e clique em verificar.', 'warning');
        return;
    }

    trava = true;
    searchRedacaoBtn.disabled = true;
    const originalText = searchRedacaoBtn.innerHTML;
    searchRedacaoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';

    try {
        await loginAndFetchRedacoes();
    } catch (error) {
        console.error("Erro na busca:", error);
        showNotification('Falha na busca. Tente novamente.', 'error');
    } finally {
        trava = false;
        searchRedacaoBtn.disabled = false;
        searchRedacaoBtn.innerHTML = originalText;
    }
});

async function loginAndFetchRedacoes() {
    const loginData = { user: raInput.value, senha: senhaInput.value };
    const headers = { 
        'Accept': 'application/json',
        'Ocp-Apim-Subscription-Key': config.Ocp_Apim_Subscription_Key,
        'Content-Type': 'application/json'
    };

    showNotification('Fazendo login...', 'info');
    const data = await makeRequest(config.LOGIN_URL, 'POST', headers, loginData);
    currentAuthToken = data.token;

    await sendRegistrationRequest(data);
}

async function sendRegistrationRequest(loginResponseData) {
    showNotification('Buscando redações...', 'info');
    const data = await makeRequest(
        `${config.API_BASE_URL}/registration/edusp/token`,
        'POST',
        { 'Content-Type': 'application/json' },
        { token: loginResponseData.token }
    );
    currentAuthToken = data.auth_token;
    userNick = data.nick;
    await fetchUserRoomsForRedacoes(data.auth_token, data.nick);
}

async function fetchUserRoomsForRedacoes(authToken, userNick) {
    const roomUserData = await makeRequest(
        `${config.API_BASE_URL}/room/user?list_all=true&with_cards=true`,
        'GET',
        { 'x-api-key': authToken }
    );

    if (roomUserData.rooms?.length > 0) {
        let uniqueTargets = new Set();
        roomUserData.rooms.forEach(room => {
            uniqueTargets.add(room.name);
            if (userNick) uniqueTargets.add(`${room.name}:${userNick}`);
        });

        const allTasks = await fetchTasksForRedacoes(authToken, Array.from(uniqueTargets), ['pending', 'draft']);
        currentFetchedRedacoes = allTasks.filter(task => isRedacao(task));

        if (currentFetchedRedacoes.length > 0) {
            displayRedacoesInSelectionModal(currentFetchedRedacoes);
            showNotification(`Encontradas ${currentFetchedRedacoes.length} redações.`, 'success');
        } else {
            showNotification('Nenhuma redação encontrada.', 'info');
        }
    } else {
        showNotification('Nenhuma sala encontrada.', 'info');
    }
}

async function fetchTasksForRedacoes(token, targetPublications, statusFilters) {
    const targetParams = targetPublications.map(t => `publication_target=${encodeURIComponent(t)}`).join('&');
    const statusParams = statusFilters.map(s => `answer_statuses=${encodeURIComponent(s)}`).join('&');
    const url = `${config.API_BASE_URL}/tms/task/todo?expired_only=false&limit=100&offset=0&filter_expired=true&is_exam=false&with_answer=true&is_essay=true&with_apply_moment=true&${targetParams}&${statusParams}`;
    
    try {
        const data = await makeRequest(url, 'GET', { 'x-api-key': token });
        return data || [];
    } catch (error) {
        console.error("Erro ao buscar tarefas:", error);
        return [];
    }
}

function displayRedacoesInSelectionModal(redacoes) {
    redacaoListContainer.innerHTML = '';
    redacoes.forEach(redacao => {
        const listItem = document.createElement('div');
        listItem.className = 'task-list-checkbox';
        const status = redacao.answer_status === 'draft' ? 'Rascunho' : 'Pendente';
        const statusColor = status === 'Pendente' ? '#f0ad4e' : '#facc15';
        listItem.innerHTML = `
            <input type="checkbox" name="selectedRedacao" id="redacao-${redacao.id}" value="${redacao.id}">
            <label for="redacao-${redacao.id}">${redacao.title} (<span style="color: ${statusColor}">${status}</span>)</label>
        `;
        redacaoListContainer.appendChild(listItem);
    });
    redacaoSelectionModal.style.display = 'flex';
}

// === EVENT LISTENERS PARA MODAIS ===
closeRedacaoSelectionModalBtn.addEventListener('click', () => {
    redacaoSelectionModal.style.display = 'none';
});

selectRedacaoBtn.addEventListener('click', () => {
    const checked = redacaoListContainer.querySelector('input[type="checkbox"]:checked');
    if (checked) {
        selectedRedacaoId = checked.value;
        const selectedRedacao = currentFetchedRedacoes.find(r => r.id == selectedRedacaoId);
        
        redacaoSelectionModal.style.display = 'none';
        showNotification(`Redação "${selectedRedacao.title}" selecionada!`, 'success');
        
        // Aqui você pode adicionar a lógica de processamento da redação
        // startRedactionProcess(selectedRedacao);
        
    } else {
        showNotification('Selecione uma redação.', 'warning');
    }
});

// Fechar modal ao clicar fora
window.addEventListener('click', (event) => {
    if (event.target === redacaoSelectionModal) {
        redacaoSelectionModal.style.display = 'none';
    }
    if (event.target === progressModal) {
        // Não permite fechar o modal de progresso clicando fora
        // progressModal.style.display = 'none';
    }
});

// === PROTEÇÃO CONTRA DEVTOOLS ===
document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || e.key === 'f12') {
        e.preventDefault();
    }
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
    }
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
    }
});

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// === FUNÇÕES AUXILIARES PARA PROCESSAMENTO DE REDAÇÃO ===
// (Adicione aqui suas funções de processamento da redação com Gemini AI)

// Exemplo de função que você pode usar:
/*
async function startRedactionProcess(redacao) {
    progressModal.style.display = 'flex';
    progressModalMessage.textContent = 'Processando redação...';
    
    try {
        // Sua lógica de processamento aqui
        const minTime = parseInt(minTimeInput.value) * 60000;
        const maxTime = parseInt(maxTimeInput.value) * 60000;
        const waitTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
        
        // Simula processamento
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        progressModal.style.display = 'none';
        showNotification('Redação processada com sucesso!', 'success');
        
    } catch (error) {
        progressModal.style.display = 'none';
        showNotification('Erro ao processar redação: ' + error.message, 'error');
    }
}
*/

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', () => {
    showNotification('Sistema Trollchipss Redação carregado!', 'success', 3000);
    
    // Verifica se há credenciais salvas (localStorage)
    // Você pode adicionar essa funcionalidade se quiser
});

// === FUNÇÕES DE ARMAZENAMENTO LOCAL (OPCIONAL) ===
/*
function saveCredentials() {
    if (raInput.value && senhaInput.value) {
        const credentials = {
            ra: raInput.value,
            // Não salve a senha em texto puro em produção!
            // senha: senhaInput.value
        };
        localStorage.setItem('trollchipss_credentials', JSON.stringify(credentials));
    }
}

function loadCredentials() {
    const saved = localStorage.getItem('trollchipss_credentials');
    if (saved) {
        const credentials = JSON.parse(saved);
        raInput.value = credentials.ra || '';
        // senhaInput.value = credentials.senha || '';
        
        if (raInput.value) clearStudentId.classList.remove('hidden');
        if (senhaInput.value) clearPassword.classList.remove('hidden');
    }
}
*/

// === PREVENIR SUBMIT DO FORMULÁRIO ===
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    searchRedacaoBtn.click();
});

// === LOG DE DESENVOLVIMENTO (REMOVER EM PRODUÇÃO) ===
console.log('%c🎓 Trollchipss Redação System v4.0', 'color: #4a6bff; font-size: 16px; font-weight: bold;');
console.log('%c✨ Sistema carregado com sucesso!', 'color: #10b981; font-size: 12px;');
