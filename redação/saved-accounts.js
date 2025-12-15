// ============================================
// SISTEMA DE CONTAS SALVAS - TROLLCHIPSS
// Arquivo: saved-accounts.js
// Versão: 1.0
// Autor: Vtbr2
// Descrição: Sistema de salvamento local de contas
// com expiração automática de 1 hora
// ============================================

'use strict';

// === CONFIGURAÇÕES ===
const STORAGE_KEY = 'trollchipss_saved_accounts';
const ACCOUNT_EXPIRY_TIME = 60 * 60 * 1000; // 1 hora em milissegundos

// === ELEMENTOS DO DOM ===
const savedAccountsModal = document.getElementById('savedAccountsModal');
const savedAccountsContainer = document.getElementById('savedAccountsContainer');
const closeSavedAccountsModalBtn = document.getElementById('closeSavedAccountsModalBtn');
const clearAllAccountsBtn = document.getElementById('clearAllAccountsBtn');
const quickLoginBtn = document.getElementById('quickLoginBtn');
const accountCount = document.getElementById('accountCount');

// === FUNÇÕES PRINCIPAIS ===

/**
 * Salva ou atualiza uma conta no localStorage
 * @param {string} ra - Registro Acadêmico do aluno
 * @param {string} senha - Senha da conta
 */
function saveAccount(ra, senha) {
    if (!ra || !senha) {
        console.warn('⚠️ RA ou senha vazios, não será salvo');
        return;
    }

    const accounts = getSavedAccounts();
    
    // Verifica se já existe uma conta com este RA
    const existingIndex = accounts.findIndex(acc => acc.ra === ra);
    
    const accountData = {
        ra: ra,
        senha: senha,
        savedAt: Date.now()
    };
    
    if (existingIndex !== -1) {
        // Atualiza a conta existente (renova o tempo)
        accounts[existingIndex] = accountData;
        console.log('🔄 Conta atualizada:', ra);
    } else {
        // Adiciona nova conta
        accounts.push(accountData);
        console.log('✅ Nova conta salva:', ra);
    }
    
    // Salva no localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    
    // Atualiza a interface
    updateQuickLoginButton();
    
    // Notificação (usa a função do script principal se existir)
    if (typeof showNotification === 'function') {
        showNotification('✅ Conta salva com sucesso!', 'success', 3000);
    }
}

/**
 * Obtém todas as contas salvas (remove as expiradas automaticamente)
 * @returns {Array} Array de contas válidas
 */
function getSavedAccounts() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        
        const accounts = JSON.parse(stored);
        const now = Date.now();
        
        // Filtra contas que ainda não expiraram (1 hora)
        const validAccounts = accounts.filter(acc => {
            const timeElapsed = now - acc.savedAt;
            return timeElapsed < ACCOUNT_EXPIRY_TIME;
        });
        
        // Se alguma conta expirou, atualiza o localStorage
        if (validAccounts.length !== accounts.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(validAccounts));
            console.log(`🗑️ ${accounts.length - validAccounts.length} conta(s) expirada(s) removida(s)`);
        }
        
        return validAccounts;
    } catch (error) {
        console.error('❌ Erro ao carregar contas do localStorage:', error);
        return [];
    }
}

/**
 * Deleta uma conta específica do localStorage
 * @param {string} ra - RA da conta a ser deletada
 */
function deleteAccount(ra) {
    const accounts = getSavedAccounts();
    const filtered = accounts.filter(acc => acc.ra !== ra);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log('🗑️ Conta deletada:', ra);
    
    // Atualiza a interface
    updateQuickLoginButton();
    displaySavedAccounts();
    
    // Notificação
    if (typeof showNotification === 'function') {
        showNotification('🗑️ Conta removida!', 'info', 3000);
    }
}

/**
 * Limpa todas as contas salvas do localStorage
 */
function clearAllAccounts() {
    if (confirm('⚠️ Tem certeza que deseja remover todas as contas salvas?')) {
        localStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ Todas as contas foram removidas');
        
        // Atualiza a interface
        updateQuickLoginButton();
        savedAccountsModal.style.display = 'none';
        
        // Notificação
        if (typeof showNotification === 'function') {
            showNotification('🗑️ Todas as contas foram removidas!', 'info', 3000);
        }
    }
}

/**
 * Usa uma conta salva (preenche os campos de login)
 * @param {string} ra - RA da conta
 * @param {string} senha - Senha da conta
 */
function useAccount(ra, senha) {
    const raInput = document.getElementById('studentId');
    const senhaInput = document.getElementById('password');
    const clearStudentId = document.getElementById('clearStudentId');
    const clearPassword = document.getElementById('clearPassword');
    
    if (!raInput || !senhaInput) {
        console.error('❌ Campos de login não encontrados');
        return;
    }
    
    // Preenche os campos
    raInput.value = ra;
    senhaInput.value = senha;
    
    // Fecha o modal
    savedAccountsModal.style.display = 'none';
    
    // Mostra os botões de limpar campos (se existirem)
    if (clearStudentId) clearStudentId.classList.remove('hidden');
    if (clearPassword) clearPassword.classList.remove('hidden');
    
    console.log('✅ Conta carregada:', ra);
    
    // Notificação
    if (typeof showNotification === 'function') {
        showNotification('✅ Conta carregada! Clique em "Buscar Redações"', 'success', 3000);
    }
}

/**
 * Formata o tempo restante até a conta expirar
 * @param {number} savedAt - Timestamp de quando a conta foi salva
 * @returns {string} Texto formatado do tempo restante
 */
function getTimeRemaining(savedAt) {
    const now = Date.now();
    const elapsed = now - savedAt;
    const remaining = ACCOUNT_EXPIRY_TIME - elapsed;
    
    if (remaining <= 0) return '⏰ Expirado';
    
    const minutes = Math.floor(remaining / (60 * 1000));
    
    if (minutes < 1) return '⏰ Menos de 1 min';
    if (minutes === 1) return '⏰ 1 minuto';
    if (minutes < 60) return `⏰ ${minutes} minutos`;
    
    // Se for mais de 1 hora (não deveria acontecer, mas por segurança)
    return '⏰ Expirando em breve';
}

/**
 * Exibe as contas salvas no modal
 */
function displaySavedAccounts() {
    if (!savedAccountsContainer) {
        console.error('❌ Container de contas não encontrado');
        return;
    }

    const accounts = getSavedAccounts();
    savedAccountsContainer.innerHTML = '';
    
    if (accounts.length === 0) {
        savedAccountsContainer.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); padding: 30px 20px;">
                📋 Nenhuma conta salva no momento.<br>
                <small style="font-size: 0.85rem; opacity: 0.8;">As contas são salvas automaticamente após o login</small>
            </p>
        `;
        if (clearAllAccountsBtn) {
            clearAllAccountsBtn.style.display = 'none';
        }
        return;
    }
    
    if (clearAllAccountsBtn) {
        clearAllAccountsBtn.style.display = 'block';
    }
    
    // Ordena por mais recente primeiro
    accounts.sort((a, b) => b.savedAt - a.savedAt);
    
    accounts.forEach(account => {
        const accountItem = document.createElement('div');
        accountItem.className = 'account-item';
        
        const timeRemaining = getTimeRemaining(account.savedAt);
        
        accountItem.innerHTML = `
            <div class="account-info">
                <div class="account-ra">${account.ra}</div>
                <div class="account-time">Expira em: ${timeRemaining}</div>
            </div>
            <div class="account-actions">
                <button class="btn-use" onclick="useAccount('${account.ra}', '${account.senha}')">
                    Usar
                </button>
                <button class="btn-delete" onclick="deleteAccount('${account.ra}')">
                    🗑️
                </button>
            </div>
        `;
        
        savedAccountsContainer.appendChild(accountItem);
    });
}

/**
 * Atualiza a visibilidade e contador do botão de contas salvas
 */
function updateQuickLoginButton() {
    if (!quickLoginBtn || !accountCount) return;
    
    const accounts = getSavedAccounts();
    
    if (accounts.length > 0) {
        quickLoginBtn.style.display = 'flex';
        accountCount.textContent = accounts.length;
    } else {
        quickLoginBtn.style.display = 'none';
    }
}

// === EVENT LISTENERS ===

// Abrir modal de contas salvas
if (quickLoginBtn) {
    quickLoginBtn.addEventListener('click', () => {
        displaySavedAccounts();
        savedAccountsModal.style.display = 'flex';
    });
}

// Fechar modal de contas salvas
if (closeSavedAccountsModalBtn) {
    closeSavedAccountsModalBtn.addEventListener('click', () => {
        savedAccountsModal.style.display = 'none';
    });
}

// Limpar todas as contas
if (clearAllAccountsBtn) {
    clearAllAccountsBtn.addEventListener('click', clearAllAccounts);
}

// Fechar modal ao clicar fora
window.addEventListener('click', (event) => {
    if (event.target === savedAccountsModal) {
        savedAccountsModal.style.display = 'none';
    }
});

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', () => {
    // Atualiza o botão ao carregar a página
    updateQuickLoginButton();
    
    // Atualiza a cada minuto para refletir tempo restante
    setInterval(() => {
        // Se o modal estiver aberto, atualiza a lista
        if (savedAccountsModal && savedAccountsModal.style.display === 'flex') {
            displaySavedAccounts();
        }
        // Sempre atualiza o botão (remove contas expiradas)
        updateQuickLoginButton();
    }, 60000); // 60 segundos
    
    console.log('✅ Sistema de Contas Salvas carregado!');
    console.log(`⏰ Contas expiram em: ${ACCOUNT_EXPIRY_TIME / (60 * 1000)} minutos`);
});

// === EXPORTA FUNÇÕES PARA USO EXTERNO ===
// Torna as funções principais acessíveis globalmente
window.saveAccount = saveAccount;
window.getSavedAccounts = getSavedAccounts;
window.deleteAccount = deleteAccount;
window.clearAllAccounts = clearAllAccounts;
window.useAccount = useAccount;
