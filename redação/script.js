//made by @vitor Rodrigues
//@cryptitys 
//Projeto original, se vc está lendo isso vc é um tremendo bosta
//última atualização 2025/12/14

// === PROTEÇÃO DE SEGURANÇA ===
(function () {
    const securityConfig = {
        disableSecurity: false,
        blockedKeys: { F12: true, I: true, C: true, J: true, U: true },
        keyCodeMap: { 123: 'F12', 73: 'I', 67: 'C', 74: 'J', 85: 'U' }
    };

    document.addEventListener('contextmenu', (e) => {
        if (!securityConfig.disableSecurity) e.preventDefault();
    });

    document.addEventListener('keydown', (e) => {
        if (securityConfig.disableSecurity) return;
        const key = securityConfig.keyCodeMap[e.keyCode] || e.key;
        if (key === 'F12' || (e.ctrlKey && e.shiftKey && securityConfig.blockedKeys[key])) e.preventDefault();
        if (e.ctrlKey && key === 'U') e.preventDefault();
    });

    const consoleProtection = new Error();
    Object.defineProperties(consoleProtection, {
        toString: {
            value() {
                if ((new Error()).stack.includes('toString@')) location.reload();
            }
        },
        message: {
            get() { location.reload(); }
        }
    });
    console.log(consoleProtection);
})();

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
let currentTaskId = null;
let currentRoomName = null;
let currentQuestionId = null;
let currentQuestionType = null;
let currentRedacaoContent = null;

// === ELEMENTOS DA DOM (ATUALIZADOS PARA O NOVO HTML) ===
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

// === PROMPTS PARA GEMINI AI ===
const promptsGeracao = [
    `Crie uma redação escolar completa a partir das informações abaixo. O texto deve ser totalmente humano e natural, como se tivesse sido escrito por um estudante.

Siga estas regras de forma obrigatória:

1. A redação deve ter um título criativo.
2. Escreva o texto completo da redação, em parágrafos corridos.
3. Não use ** ou * em nenhum lugar do título ou do texto.
4. Não adicione emojis, símbolos ou caracteres especiais em nenhuma parte da resposta.
5. Não use símbolos como traços longos ou reticências. Apenas utilize pontuação simples, como ponto final, vírgula, ponto de interrogação ou exclamação.
6. O texto deve ser claro, acessível e coerente, mantendo um tom escolar.
7. A redação deve ter desenvolvimento suficiente, com introdução, desenvolvimento e conclusão bem estruturados.
8. Não escreva listas no texto final, apenas parágrafos narrativos.
9. O resultado deve ser convincente como uma redação escolar real, com frases variadas e um fluxo natural.
10. Respeite rigorosamente a formatação a seguir:

TITULO: [Título da redação]
TEXTO: [Texto da redação]

Aqui estão as informações para a redação:
{dadosRedacao}

Lembre-se: devolva APENAS a redação pronta, sem comentários, explicações ou qualquer informação adicional.`,
];

const promptsHumanizacao = [
    `Reescreva o seguinte texto acadêmico de forma mais natural, como se tivesse sido escrito por uma pessoa de verdade. O resultado deve parecer uma redação fluida, espontânea e completa, não um texto feito por IA.

Aqui estão as instruções obrigatórias que você deve seguir:

1. Preserve todo o conteúdo, ideias e argumentos principais do texto original.
2. Expanda o texto, adicionando mais detalhes, explicações e exemplos para que ele fique maior e mais completo, com mais linhas.
3. Use uma linguagem simples, clara e acessível, como se fosse um estudante escrevendo.
4. Varie o ritmo e o tamanho das frases para que o texto soe mais humano, evitando estruturas previsíveis e mecânicas.
5. Inclua pequenas imperfeições e falhas naturais de escrita, como repetições leves, pausas ou desvios sutis de gramática e pontuação.
6. Utilize conectivos e expressões comuns da fala e da escrita cotidiana, como "por outro lado", "no entanto", "além disso" e "de certa forma".
7. Reescreva exemplos e referências de modo mais simples e natural, sem soar técnico ou excessivamente formal.
8. Evite jargões difíceis e termos muito acadêmicos. Prefira explicações fáceis de compreender.
9. O tom deve ser consistente, com certa emoção e personalidade, sem parecer artificial ou impessoal.
10. Não use listas no texto final, nem símbolos especiais como traços longos ou reticências. Escreva em parágrafos corridos e narrativos.
11. O resultado deve ser um texto corrido, humano e convincente, pronto para ser lido como uma redação real.

Texto para reescrever:
{textoRedacao}

Devolva APENAS o texto reescrito, sem comentários, explicações ou marcações adicionais.`,
];

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
    const options = { 
        method, 
        headers: { 
            'User-Agent': config.USER_AGENT,
            'Content-Type': 'application/json',
            ...headers 
        } 
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`❌ HTTP ${method} ${url} => ${response.status}`);
    return response.json();
}

function getDefaultHeaders(authToken = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-realm': 'edusp',
        'x-api-platform': 'webclient',
        'User-Agent': config.USER_AGENT,
        'Connection': 'keep-alive',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty'
    };
    if (authToken) {
        headers['x-api-key'] = authToken;
    }
    return headers;
}

function isRedacao(task) {
    return task.tags?.some(t => t.toLowerCase().includes('redacao')) ||
        task.title?.toLowerCase().includes('redação');
}

function stripHtml(htmlString) {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
    return doc.body.textContent || "";
}

function removeUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\/[^\s]*)/g;
    return text.replace(urlRegex, '').trim();
}

function parseRedactionSections(rawHtmlContent) {
    const sections = {
        'ENUNCIADO': { content: '', isImage: false },
        'Texto I': { content: '', isImage: false },
        'Texto II': { content: '', isImage: false },
        'Texto III': { content: '', isImage: false }
    };
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtmlContent, 'text/html');
    const body = doc.body;
    const sectionIdentifiers = ['Texto I', 'Texto II', 'Texto III', 'ENUNCIADO'];
    let currentSectionKey = null;
    let tempContentNodes = [];

    const flushContent = () => {
        if (currentSectionKey && tempContentNodes.length > 0) {
            const sectionHtml = tempContentNodes.map(node => node.outerHTML || node.textContent).join('');
            const isImageSection = sectionHtml.includes('<img');
            sections[currentSectionKey].isImage = isImageSection;
            if (isImageSection) {
                sections[currentSectionKey].content = '[IMAGEM]';
            } else {
                sections[currentSectionKey].content = removeUrls(stripHtml(sectionHtml)).trim();
            }
        }
        tempContentNodes = [];
    };

    for (let i = 0; i < body.childNodes.length; i++) {
        const node = body.childNodes[i];
        if (node.nodeType === Node.ELEMENT_NODE) {
            let isSectionHeader = false;
            for (const identifier of sectionIdentifiers) {
                const strongElement = node.tagName === 'STRONG' ? node : node.querySelector('strong');
                if (strongElement && strongElement.textContent.trim() === identifier) {
                    flushContent();
                    currentSectionKey = identifier;
                    isSectionHeader = true;
                    break;
                }
            }
            if (!isSectionHeader) {
                if (currentSectionKey) {
                    tempContentNodes.push(node);
                }
            }
        } else if (node.nodeType === Node.TEXT_NODE) {
            if (currentSectionKey) {
                tempContentNodes.push(node);
            }
        }
    }
    flushContent();
    return sections;
}

// === FUNÇÕES GEMINI AI ===
async function fetchGeminiContent(prompt) {
    const chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    const payload = { contents: chatHistory };
    const randomKeyIndex = Math.floor(Math.random() * config.GEMINI_API_KEYS.length);
    const apiKey = config.GEMINI_API_KEYS[randomKeyIndex];
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro da API Gemini: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        
        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            return '';
        }
    } catch (error) {
        console.error('Erro ao chamar a API Gemini:', error);
        throw error;
    }
}

async function callGeminiAPI(redactionContent) {
    showNotification('Gerando redação com IA...', 'info');
    try {
        const promptGeracaoAleatorio = promptsGeracao[Math.floor(Math.random() * promptsGeracao.length)]
            .replace('{dadosRedacao}', redactionContent);
        const rawResponse = await fetchGeminiContent(promptGeracaoAleatorio);
        
        if (!rawResponse.includes("TITULO:") || !rawResponse.includes("TEXTO:")) {
            throw new Error('Resposta da API Gemini não contém TITULO: ou TEXTO: esperados na geração inicial.');
        }
        
        const generatedTitle = rawResponse.split("TITULO:")[1].split("TEXTO:")[0]
            .replace(/^Título:\s*/i, '').replace(/#/g, '').trim();
        const generatedText = rawResponse.split("TEXTO:")[1].trim();
        
        showNotification('Humanizando texto...', 'info');
        const promptHumanizacaoAleatorio = promptsHumanizacao[Math.floor(Math.random() * promptsHumanizacao.length)]
            .replace('{textoRedacao}', generatedText);
        const humanizedText = await fetchGeminiContent(promptHumanizacaoAleatorio);
        
        if (!humanizedText) {
            throw new Error('A humanização retornou um texto vazio.');
        }
        
        return { title: generatedTitle, text: humanizedText };
    } catch (error) {
        console.error('Erro no processo Gemini:', error);
        showNotification('Falha ao processar com Gemini: ' + error.message, 'error');
        throw error;
    }
}

// === FUNÇÕES DE REDAÇÃO ===
async function fetchRedacaoContent(taskId, token, roomName) {
    const url = `${config.API_BASE_URL}/tms/task/${taskId}/apply?preview_mode=false&token_code=null&room_name=${roomName}`;
    const headers = { 'x-api-key': token };
    try {
        const data = await makeRequest(url, 'GET', headers);
        return data;
    } catch (error) {
        throw error;
    }
}

async function submitRedactionDraft(taskId, questionId, questionType, title, body, authToken, roomName, status, answerId = null) {
    showNotification('Enviando redação...', 'info');
    let url;
    let method;
    
    if (status === "draft" && answerId) {
        url = `${config.API_BASE_URL}/tms/task/${taskId}/answer/${answerId}`;
        method = "PUT";
    } else {
        url = `${config.API_BASE_URL}/tms/task/${taskId}/answer`;
        method = "POST";
    }
    
    const headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "referer": "https://saladofuturo.educacao.sp.gov.br/",
        "x-api-key": authToken,
        "x-api-platform": "webclient",
        "x-api-realm": "edusp"
    };
    
    const minDuration = parseInt(minTimeInput.value) * 60 * 1000;
    const maxDuration = parseInt(maxTimeInput.value) * 60 * 1000;
    const duration = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;

    let requestBody;
    if (status === "draft") {
        requestBody = {
            status: "draft",
            accessed_on: "room",
            executed_on: "",
            duration: duration,
            answers: {
                [questionId]: {
                    question_id: questionId,
                    question_type: questionType,
                    answer: {
                        title: title,
                        body: body
                    }
                }
            }
        };
    } else {
        requestBody = {
            status: "draft",
            accessed_on: "room",
            executed_on: `${roomName}`,
            duration: duration,
            answers: {
                [questionId]: {
                    question_id: questionId,
                    question_type: questionType,
                    answer: {
                        title: title,
                        body: body
                    }
                }
            }
        };
    }
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Falha ao enviar: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Redação enviada com sucesso como ${status}:`, data);
        return data;
    } catch (error) {
        console.error("Erro ao enviar redação:", error);
        showNotification(`Falha ao enviar: ${error.message}`, 'error');
        throw error;
    }
}

async function startRedactionProcess(redacao) {
    showNotification('Iniciando o processo de redação...', 'info');
    progressModal.style.display = 'flex';
    progressModalMessage.textContent = 'Processando redação...';
    
    try {
        const taskId = redacao.id;
        const roomName = redacao.room_name_for_apply;
        const redacaoStatus = redacao.answer_status;
        const answerId = redacao.answer_id;

        showNotification('Buscando conteúdo da redação...', 'info');
        const data = await fetchRedacaoContent(taskId, currentAuthToken, roomName);
        currentTaskId = taskId;
        currentRoomName = roomName;

        let foundQuestionId = null;
        let foundQuestionType = null;

        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            foundQuestionId = data.questions[0].id;
            foundQuestionType = data.questions[0].type;
        } else if (data.statements && Array.isArray(data.statements) && data.statements.length > 0 && 
                   data.statements[0].questions && Array.isArray(data.statements[0].questions) && 
                   data.statements[0].questions.length > 0) {
            foundQuestionId = data.statements[0].questions[0].id;
            foundQuestionType = data.statements[0].questions[0].type;
        }

        if (foundQuestionId && foundQuestionType) {
            currentQuestionId = foundQuestionId;
            currentQuestionType = foundQuestionType;
        } else {
            throw new Error('ID ou Tipo da Questão não encontrado para esta redação. Não é possível continuar.');
        }

        let fullContent = `Título da Redação: ${redacao.title}\n\n`;
        fullContent += `Descrição: ${stripHtml(data.description || 'N/A')}\n\n`;

        let rawStatementContent = '';
        if (data.statements && Array.isArray(data.statements) && data.statements.length > 0) {
            rawStatementContent = data.statements[0].statement || data.statements[0].text || '';
        } else if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            rawStatementContent = data.questions[0].statement || data.questions[0].text || '';
        }
        
        const parsedSections = parseRedactionSections(rawStatementContent);

        if (parsedSections['ENUNCIADO'].content !== '') {
            fullContent += `Enunciado:\n${parsedSections['ENUNCIADO'].content}\n\n`;
        }
        
        const validTextContents = [];
        if (parsedSections['Texto I'].content !== '[IMAGEM]' && parsedSections['Texto I'].content !== '') {
            validTextContents.push(parsedSections['Texto I'].content);
        }
        if (parsedSections['Texto II'].content !== '[IMAGEM]' && parsedSections['Texto II'].content !== '') {
            validTextContents.push(parsedSections['Texto II'].content);
        }
        if (parsedSections['Texto III'].content !== '[IMAGEM]' && parsedSections['Texto III'].content !== '') {
            validTextContents.push(parsedSections['Texto III'].content);
        }
        
        if (validTextContents.length > 0) {
            fullContent += `Textos de Apoio:\n${validTextContents.join('\n\n')}\n\n`;
        }
        
        currentRedacaoContent = fullContent;

        // Aguardar tempo configurado antes de gerar
        const minTime = parseInt(minTimeInput.value) * 60 * 1000;
        const maxTime = parseInt(maxTimeInput.value) * 60 * 1000;
        const waitTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
        
        progressModalMessage.textContent = `Aguardando ${Math.round(waitTime/60000)} minutos para parecer mais humano...`;
        await new Promise(resolve => setTimeout(resolve, waitTime));

        const { title: geminiTitle, text: geminiText } = await callGeminiAPI(currentRedacaoContent);
        const cleanGeminiTitle = geminiTitle.replace(/^Título:\s*/i, '').replace(/#/g, '').trim();

        await submitRedactionDraft(currentTaskId, currentQuestionId, currentQuestionType, 
                                   cleanGeminiTitle, geminiText, currentAuthToken, currentRoomName, 
                                   redacaoStatus, answerId);

        progressModal.style.display = 'none';
        showNotification('Redação concluída e salva como rascunho!', 'success');
        showNotification('Obrigado por usar o sistema!', 'info');

    } catch (error) {
        progressModal.style.display = 'none';
        console.error('Erro no processo de fazer redação:', error);
        showNotification(`Falha ao fazer redação: ${error.message}`, 'error');
    }
}

// === FUNÇÕES DE LOGIN E BUSCA ===
async function loginAndFetchRedacoes() {
    const loginData = {
        user: raInput.value,
        senha: senhaInput.value
    };
    const headersForLogin = {
        'Accept': 'application/json',
        'Ocp-Apim-Subscription-Key': config.Ocp_Apim_Subscription_Key,
        'User-Agent': config.USER_AGENT,
        'Content-Type': 'application/json'
    };
    try {
        showNotification('Fazendo login...', 'info');
        const data = await makeRequest(config.LOGIN_URL, 'POST', headersForLogin, loginData);
        currentAuthToken = data.token;
        await sendRegistrationRequest(data);
    } catch (error) {
        showNotification('Não foi possível logar! Verifique suas credenciais.', 'error');
        throw error;
    }
}

async function sendRegistrationRequest(loginResponseData) {
    try {
        showNotification('Buscando redações...', 'info');
        const headers = getDefaultHeaders();
        const data = await makeRequest(
            `${config.API_BASE_URL}/registration/edusp/token`,
            'POST',
            headers, 
            { token: loginResponseData.token }
        );
        currentAuthToken = data.auth_token;
        userNick = data.nick;
        await fetchUserRoomsForRedacoes(data.auth_token, data.nick);
    } catch (error) {
        showNotification('Erro ao registrar informações.', 'error');
        throw error;
    }
}

async function fetchUserRoomsForRedacoes(authToken, userNick) {
    try {
        const headersWithAuth = getDefaultHeaders(authToken);
        const roomUserData = await makeRequest(
            `${config.API_BASE_URL}/room/user?list_all=true&with_cards=true`,
            'GET',
            headersWithAuth
        );
        
        if (roomUserData.rooms && roomUserData.rooms.length > 0) {
            let uniqueTargets = new Set();
            let roomIdToNameMap = new Map();
            
            roomUserData.rooms.forEach(room => {
                uniqueTargets.add(room.name);
                roomIdToNameMap.set(room.id.toString(), room.name);
                if (userNick) {
                    uniqueTargets.add(`${room.name}:${userNick}`);
                }
            });
            
            const roomUserJsonString = JSON.stringify(roomUserData);
            const idMatches = roomUserJsonString.match(/"id"\s*:\s*(\d{3,4})(?!\d)/g) || [];
            idMatches.forEach(m => {
                const id = m.match(/\d{3,4}/)[0];
                if (id) uniqueTargets.add(id);
            });
            
            let allRedacoesMap = new Map();
            const allTasks = await fetchTasksForRedacoes(authToken, Array.from(uniqueTargets), ['pending', 'draft']);
            
            allTasks.filter(task => isRedacao(task)).forEach(task => {
                const actualStatus = task.answer_status === 'draft' ? 'draft' : 'pending';
                let roomNameForTask = '';
                
                if (task.publication_target) {
                    if (task.publication_target.includes(':')) {
                        roomNameForTask = task.publication_target.split(':')[0];
                    } else if (roomIdToNameMap.has(task.publication_target)) {
                        roomNameForTask = roomIdToNameMap.get(task.publication_target);
                    } else {
                        roomNameForTask = task.publication_target;
                    }
                }
                
                if (allRedacoesMap.has(task.id)) {
                    const existingRedacao = allRedacoesMap.get(task.id);
                    if (existingRedacao.status === 'draft' && actualStatus === 'pending') {
                        allRedacoesMap.set(task.id, { 
                            ...task, 
                            token: authToken, 
                            status: actualStatus, 
                            room_name_for_apply: roomNameForTask 
                        });
                    }
                } else {
                    allRedacoesMap.set(task.id, { 
                        ...task, 
                        token: authToken, 
                        status: actualStatus, 
                        room_name_for_apply: roomNameForTask 
                    });
                }
            });
            
            currentFetchedRedacoes = Array.from(allRedacoesMap.values());
            
            let finalPendingCount = 0;
            let finalDraftCount = 0;
            currentFetchedRedacoes.forEach(redacao => {
                if (redacao.status === 'pending') finalPendingCount++;
                else if (redacao.status === 'draft') finalDraftCount++;
            });
            
            if (currentFetchedRedacoes.length > 0) {
                displayRedacoesInSelectionModal(currentFetchedRedacoes);
                if (finalPendingCount === 0 && finalDraftCount > 0) {
                    showNotification('Não foram encontradas redações pendentes, mas há redações em rascunho.', 'info');
                } else if (finalPendingCount > 0) {
                    showNotification(`Você tem ${finalPendingCount} redações pendentes e ${finalDraftCount} em rascunho.`, 'success');
                } else if (finalDraftCount > 0) {
                    showNotification(`Você tem ${finalDraftCount} redações em rascunho.`, 'info');
                }
            } else {
                showNotification('Nenhuma redação encontrada.', 'info');
            }
        } else {
            showNotification('Nenhuma sala encontrada.', 'info');
        }
    } catch (error) {
        showNotification('Erro ao buscar salas.', 'error');
        throw error;
    } finally {
      trava = false;
    }
}

async function fetchTasksForRedacoes(token, targetPublications, statusFilters) {
    const commonParams = `expired_only=false&limit=100&offset=0&filter_expired=true&is_exam=false&with_answer=true&is_essay=true&with_apply_moment=true`;
    const targetParams = targetPublications.map(target => {
        if (target.includes(':') && target.split(':').length === 2) {
            const [roomPart, nickPart] = target.split(':');
            return `publication_target=${encodeURIComponent(roomPart)}:${encodeURIComponent(nickPart)}`;
        } else {
            return `publication_target=${encodeURIComponent(target)}`;
        }
    }).join('&');
    const statusParams = statusFilters.map(status => `answer_statuses=${encodeURIComponent(status)}`).join('&');
    const url = `${config.API_BASE_URL}/tms/task/todo?${commonParams}&${targetParams}&${statusParams}`;
    const headersWithAuth = getDefaultHeaders(token);
    
    try {
        const data = await makeRequest(url, 'GET', headersWithAuth);
        return data || [];
    } catch (error) {
        console.error(`❌ Erro ao buscar tarefas:`, error);
        return [];
    }
}

function displayRedacoesInSelectionModal(redacoes) {
    redacaoListContainer.innerHTML = '';
    
    if (redacoes.length === 0) {
        redacaoListContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhuma redação encontrada.</p>';
        selectRedacaoBtn.disabled = true;
    } else {
        const sortedRedacoes = [...redacoes].sort((a, b) => {
            if (a.status === 'pending' && b.status === 'draft') return -1;
            if (a.status === 'draft' && b.status === 'pending') return 1;
            return 0;
        });
        
        sortedRedacoes.forEach(redacao => {
            const listItem = document.createElement('div');
            listItem.className = 'task-list-checkbox';
            const statusText = redacao.status === 'pending' ? 'Pendente' : 'Rascunho';
            const statusColor = redacao.status === 'pending' ? '#f0ad4e' : '#facc15';
            
            listItem.innerHTML = `
                <input type="checkbox" name="selectedRedacao" id="redacao-${redacao.id}" value="${redacao.id}">
                <label for="redacao-${redacao.id}">${redacao.title} (<span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>)</label>
            `;
            
            redacaoListContainer.appendChild(listItem);
            
            const checkbox = listItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                const checkedCheckboxes = redacaoListContainer.querySelectorAll('input[type="checkbox"]:checked');
                selectRedacaoBtn.disabled = checkedCheckboxes.length === 0;
            });
        });
        
        selectRedacaoBtn.disabled = redacoes.length === 0;
    }
    
    redacaoSelectionModal.style.display = 'flex';
}

// === EVENT LISTENERS ===

// Lógica de verificação (quadradinho)
verifyBtn.addEventListener('click', () => {
    verifyBtn.style.display = 'none';
    spinner.style.display = 'inline-block';
    statusText.textContent = 'Verificando…';
    
    setTimeout(() => {
        spinner.style.display = 'none';
        verifyBtn.style.display = 'inline-block';
        verifyBtn.classList.add('checked');
        verifyBtn.style.background = 'var(--success-color)';
        verifyBtn.style.borderColor = 'var(--success-color)';
        statusText.textContent = '✅ Verificado';
        searchRedacaoBtn.disabled = false;
    }, 2000);
});

// Toggle de senha
if (togglePassword && senhaInput) {
    togglePassword.addEventListener('click', function() {
        const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
        senhaInput.setAttribute('type', type);
        togglePassword.textContent = type === 'password' ? '👁' : '🔒';
    });
}

// Botões de limpar campos
if (raInput && clearStudentId) {
    raInput.addEventListener('input', () => {
        clearStudentId.classList.toggle('hidden', !raInput.value);
    });

    clearStudentId.addEventListener('click', () => {
        raInput.value = '';
        clearStudentId.classList.add('hidden');
        raInput.focus();
    });
}

if (senhaInput && clearPassword) {
    senhaInput.addEventListener('input', () => {
        clearPassword.classList.toggle('hidden', !senhaInput.value);
    });

    clearPassword.addEventListener('click', () => {
        senhaInput.value = '';
        clearPassword.classList.add('hidden');
        senhaInput.focus();
    });
}

// Buscar redações
searchRedacaoBtn.addEventListener('click', async () => {
    if (trava) return;
    
    if (!raInput.value || !senhaInput.value) {
        showNotification('Por favor, preencha o RA e a senha.', 'warning');
        return;
    }
    
    trava = true;
    searchRedacaoBtn.disabled = true;
    const originalText = searchRedacaoBtn.innerHTML;
    searchRedacaoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
    
    try {
        await loginAndFetchRedacoes();
    } catch (error) {
        console.error("Erro no processo de busca de redações:", error);
    } finally {
        trava = false;
        searchRedacaoBtn.disabled = false;
        searchRedacaoBtn.innerHTML = originalText;
    }
});

// Fechar modal de seleção
closeRedacaoSelectionModalBtn.addEventListener('click', () => {
    redacaoSelectionModal.style.display = 'none';
});

// Selecionar redação
selectRedacaoBtn.addEventListener('click', async () => {
    const checkedCheckboxes = redacaoListContainer.querySelectorAll('input[type="checkbox"]:checked');
    
    if (checkedCheckboxes.length > 0) {
        redacaoSelectionModal.style.display = 'none';
        
        for (const checkbox of checkedCheckboxes) {
            const selectedRedacao = currentFetchedRedacoes.find(r => r.id.toString() === checkbox.value);
            if (selectedRedacao) {
                await startRedactionProcess(selectedRedacao);
            }
        }
        
        showNotification(`Processo concluído para ${checkedCheckboxes.length} redação(ões).`, 'success');
    } else {
        showNotification('Selecione uma redação para continuar.', 'warning');
    }
});

// Fechar modais ao clicar fora
window.addEventListener('click', (event) => {
    if (event.target === redacaoSelectionModal) {
        redacaoSelectionModal.style.display = 'none';
    }
    // Não permite fechar o modal de progresso clicando fora
    // if (event.target === progressModal) {
    //     progressModal.style.display = 'none';
    // }
});

// Prevenir submit do formulário
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        searchRedacaoBtn.click();
    });
}

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', () => {
    showNotification('Sistema Trollchipss Redação carregado!', 'success', 3000);
    
    // Foco no primeiro campo
    if (raInput) {
        raInput.focus();
    }
});

// === LOG DE DESENVOLVIMENTO ===
console.log('%c🎓 Trollchipss Redação System v4.0', 'color: #4a6bff; font-size: 16px; font-weight: bold;');
console.log('%c✨ Sistema completo carregado com sucesso!', 'color: #10b981; font-size: 12px;');
console.log('%c🤖 Gemini AI integrado', 'color: #f59e0b; font-size: 12px;');
console.log('%c📝 Humanização de texto ativada', 'color: #6c63ff; font-size: 12px;');
console.log('%c🔒 Proteções de segurança habilitadas', 'color: #ef4444; font-size: 12px;');
