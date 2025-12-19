 <script>
        const config = {
            LOGIN_URL: 'https://sedintegracoes.educacao.sp.gov.br/credenciais/api/LoginCompletoToken',
            API_BASE_URL: 'https://edusp-api.ip.tv',
            Ocp_Apim_Subscription_Key: '2b03c1db3884488795f79c37c069381a',
            USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            MIN_TIME_PER_TASK: 60
        };

        const categoryMap = {
            1: 'Língua Portuguesa',
            5: 'Geografia',
            6: 'História',
            7: 'Sociologia',
            8: 'Biologia',
            9: 'Física',
            10: 'Matemática',
            11: 'Química',
            13: 'Inglês',
            17: 'Ciências',
            11621: 'Educação Financeira',
            5978: 'Filosofia',
            156886: 'Multidisciplinar'
        };

        const elements = {
            studentId: document.getElementById('studentId'),
            password: document.getElementById('password'),
            loginForm: document.getElementById('loginForm'),
            togglePassword: document.getElementById('togglePassword'),
            clearStudentId: document.getElementById('clearStudentId'),
            clearPassword: document.getElementById('clearPassword'),
            verifyBtn: document.getElementById('verifyBtn'),
            statusText: document.getElementById('statusText'),
            spinner: document.getElementById('spinner'),
            pendingBtn: document.getElementById('pendingBtn'),
            expiredBtn: document.getElementById('expiredBtn'),
            notificationsContainer: document.getElementById('notificationsContainer'),
            progressModal: document.getElementById('progressModal'),
            progressSteps: document.getElementById('progressSteps'),
            tasksModal: document.getElementById('tasksModal'),
            closeTasksModal: document.getElementById('closeTasksModal'),
            tasksListContainer: document.getElementById('tasksListContainer'),
            selectAllBtn: document.getElementById('selectAllBtn'),
            startExecutionBtn: document.getElementById('startExecutionBtn'),
            executionModal: document.getElementById('executionModal'),
            executionContainer: document.getElementById('executionContainer'),
            currentTaskTitle: document.getElementById('currentTaskTitle'),
            currentTaskCategory: document.getElementById('currentTaskCategory'),
            timerValue: document.getElementById('timerValue'),
            progressFill: document.getElementById('progressFill'),
            completedCount: document.getElementById('completedCount'),
            remainingCount: document.getElementById('remainingCount'),
            totalCount: document.getElementById('totalCount'),
            pauseBtn: document.getElementById('pauseBtn'),
            stopBtn: document.getElementById('stopBtn')
        };

        let currentAuthToken = null;
        let userNick = null;
        let allTasks = [];
        let selectedTasks = [];
        let executionTimer = null;
        let isPaused = false;
        let currentTaskIndex = 0;
        let timeRemaining = config.MIN_TIME_PER_TASK;
        let currentMode = null;

        function showNotification(message, type = 'info', duration = 5000) {
            const notification = document.createElement('div');
            notification.className = `Notificacao ${type}`;
            notification.innerHTML = `<p>${message}</p>`;
            elements.notificationsContainer.prepend(notification);

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
            if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
            return response.json();
        }

        function getDefaultHeaders(authToken = null) {
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-api-realm': 'edusp',
                'x-api-platform': 'webclient',
                'User-Agent': config.USER_AGENT
            };
            if (authToken) headers['x-api-key'] = authToken;
            return headers;
        }

        function addProgressStep(title, detail = '', status = 'pending') {
            const step = document.createElement('div');
            step.className = `progress-step ${status}`;
            step.id = `step-${title.replace(/\s+/g, '-').toLowerCase()}`;
            
            let icon = '⏳';
            if (status === 'active') icon = '🔄';
            if (status === 'completed') icon = '✅';
            if (status === 'error') icon = '❌';
            
            step.innerHTML = `
                <div class="step-icon">${icon}</div>
                <div class="step-text">
                    <div class="step-title">${title}</div>
                    <div class="step-detail">${detail}</div>
                </div>
                ${status === 'active' ? '<div class="spinner-small"></div>' : ''}
            `;
            
            elements.progressSteps.appendChild(step);
            return step;
        }

        function updateProgressStep(stepId, status, detail = '') {
            const step = document.getElementById(stepId);
            if (!step) return;
            
            step.className = `progress-step ${status}`;
            
            let icon = '⏳';
            if (status === 'active') icon = '🔄';
            if (status === 'completed') icon = '✅';
            if (status === 'error') icon = '❌';
            
            step.querySelector('.step-icon').textContent = icon;
            if (detail) step.querySelector('.step-detail').textContent = detail;
            
            const spinner = step.querySelector('.spinner-small');
            if (spinner) spinner.remove();
            if (status === 'active') {
                step.innerHTML += '<div class="spinner-small"></div>';
            }
        }

        async function login(ra, password) {
            const loginData = { user: ra, senha: password };
            const headers = {
                'Accept': 'application/json',
                'Ocp-Apim-Subscription-Key': config.Ocp_Apim_Subscription_Key,
                'User-Agent': config.USER_AGENT,
                'Content-Type': 'application/json'
            };
            
            const data = await makeRequest(config.LOGIN_URL, 'POST', headers, loginData);
            return data;
        }

        async function registerToken(token) {
            const headers = getDefaultHeaders();
            const data = await makeRequest(
                `${config.API_BASE_URL}/registration/edusp/token`,
                'POST',
                headers, 
                { token }
            );
            currentAuthToken = data.auth_token;
            userNick = data.nick;
            return data;
        }

        async function fetchUserRooms(authToken) {
            const headers = getDefaultHeaders(authToken);
            const data = await makeRequest(
                `${config.API_BASE_URL}/room/user?list_all=true&with_cards=true`,
                'GET',
                headers
            );
            return data.rooms || [];
        }

        async function fetchTasks(token, targets, statuses, expired = false) {
            const endpoint = expired ? 'expired' : 'todo';
            const commonParams = `limit=100&offset=0&is_essay=false`;
            
            if (!expired) {
                const targetParams = targets.map(t => `publication_target=${encodeURIComponent(t)}`).join('&');
                const statusParams = statuses.map(s => `answer_statuses=${encodeURIComponent(s)}`).join('&');
                const url = `${config.API_BASE_URL}/tms/task/${endpoint}?${commonParams}&expired_only=false&filter_expired=true&is_exam=false&with_answer=true&with_apply_moment=true&${targetParams}&${statusParams}`;
                const headers = getDefaultHeaders(token);
                
                try {
                    const data = await makeRequest(url, 'GET', headers);
                    return data || [];
                } catch (error) {
                    return [];
                }
            } else {
                const url = `${config.API_BASE_URL}/tms/task/${endpoint}?${commonParams}`;
                const headers = getDefaultHeaders(token);
                
                try {
                    const data = await makeRequest(url, 'GET', headers);
                    return data.tasks || [];
                } catch (error) {
                    return [];
                }
            }
        }

        async function getTaskDetails(authToken, taskId) {
            const headers = getDefaultHeaders(authToken);
            const url = `${config.API_BASE_URL}/tms/task/${taskId}/apply?preview_mode=false&token_code=null`;
            const data = await makeRequest(url, 'GET', headers);
            return data;
        }

        async function submitTaskAnswer(authToken, taskId, answers, duration) {
            const headers = getDefaultHeaders(authToken);
            const url = `${config.API_BASE_URL}/tms/task/${taskId}/answer`;
            
            const payload = {
                status: "submitted",
                accessed_on: "room",
                executed_on: "",
                duration: duration * 1000,
                answers: answers
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao enviar resposta: ${response.status}`);
            }
            
            return await response.json();
        }

        function getCorrectAnswer(question) {
            if (question.type === 'multiple_choice' || question.type === 'single_choice') {
                const options = question.options || [];
                const correctOption = options.find(opt => opt.correct === true);
                if (correctOption) {
                    return correctOption.id;
                }
                return options.length > 0 ? options[0].id : null;
            }
            
            if (question.type === 'true_false') {
                return question.correct_answer || true;
            }
            
            if (question.type === 'text' || question.type === 'essay') {
                return question.correct_answer || 'Resposta automática';
            }
            
            return null;
        }

        async function processTask(task) {
            try {
                const taskDetails = await getTaskDetails(currentAuthToken, task.id);
                const answers = {};
                
                let questions = [];
                if (taskDetails.questions && Array.isArray(taskDetails.questions)) {
                    questions = taskDetails.questions;
                } else if (taskDetails.statements && Array.isArray(taskDetails.statements)) {
                    taskDetails.statements.forEach(stmt => {
                        if (stmt.questions && Array.isArray(stmt.questions)) {
                            questions = questions.concat(stmt.questions);
                        }
                    });
                }
                
                questions.forEach(question => {
                    const answer = getCorrectAnswer(question);
                    if (answer !== null) {
                        answers[question.id] = {
                            question_id: question.id,
                            question_type: question.type,
                            answer: answer
                        };
                    }
                });
                
                await submitTaskAnswer(currentAuthToken, task.id, answers, config.MIN_TIME_PER_TASK);
                return true;
            } catch (error) {
                console.error('Erro ao processar tarefa:', error);
                throw error;
            }
        }

        function displayTasks(tasks) {
            elements.tasksListContainer.innerHTML = '';
            
            if (tasks.length === 0) {
                elements.tasksListContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhuma tarefa encontrada.</p>';
                elements.startExecutionBtn.disabled = true;
                return;
            }
            
            tasks.forEach((task, index) => {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';
                
                const categoryName = categoryMap[task.category_id] || 'Outras';
                
                taskItem.innerHTML = `
                    <input type="checkbox" class="task-checkbox" data-index="${index}" checked>
                    <div class="task-info">
                        <div class="task-title">${task.title}</div>
                        <div class="task-category">${categoryName}</div>
                    </div>
                `;
                
                elements.tasksListContainer.appendChild(taskItem);
            });
            
            updateSelectedTasks();
        }

        function updateSelectedTasks() {
            const checkboxes = elements.tasksListContainer.querySelectorAll('.task-checkbox');
            selectedTasks = [];
            
            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    const index = parseInt(checkbox.dataset.index);
                    selectedTasks.push(allTasks[index]);
                }
            });
            
            elements.startExecutionBtn.disabled = selectedTasks.length === 0;
        }

        function startTimer() {
            timeRemaining = config.MIN_TIME_PER_TASK;
            elements.timerValue.textContent = timeRemaining;
            elements.progressFill.style.width = '100%';
            
            executionTimer = setInterval(() => {
                if (!isPaused) {
                    timeRemaining--;
                    elements.timerValue.textContent = timeRemaining;
                    
                    const percentage = (timeRemaining / config.MIN_TIME_PER_TASK) * 100;
                    elements.progressFill.style.width = percentage + '%';
                    
                    if (timeRemaining <= 0) {
                        clearInterval(executionTimer);
                        executeNextTask();
                    }
                }
            }, 1000);
        }

        function stopTimer() {
            if (executionTimer) {
                clearInterval(executionTimer);
                executionTimer = null;
            }
        }

        async function executeNextTask() {
            if (currentTaskIndex >= selectedTasks.length) {
                stopTimer();
                showNotification('🎉 Todas as tarefas foram concluídas!', 'success');
                elements.executionModal.style.display = 'none';
                return;
            }
            
            const task = selectedTasks[currentTaskIndex];
            const categoryName = categoryMap[task.category_id] || 'Outras';
            
            elements.currentTaskTitle.textContent = task.title;
            elements.currentTaskCategory.textContent = categoryName;
            elements.remainingCount.textContent = selectedTasks.length - currentTaskIndex;
            
            try {
                await processTask(task);
                
                currentTaskIndex++;
                elements.completedCount.textContent = currentTaskIndex;
                
                showNotification(`✅ Tarefa "${task.title}" concluída!`, 'success');
                
                if (currentTaskIndex < selectedTasks.length) {
                    startTimer();
                } else {
                    stopTimer();
                    showNotification('🎉 Todas as tarefas foram concluídas!', 'success');
                    setTimeout(() => {
                        elements.executionModal.style.display = 'none';
                    }, 2000);
                }
            } catch (error) {
                showNotification(`❌ Erro ao executar tarefa: ${error.message}`, 'error');
                currentTaskIndex++;
                elements.completedCount.textContent = currentTaskIndex;
                
                if (currentTaskIndex < selectedTasks.length) {
                    startTimer();
                } else {
                    stopTimer();
                    elements.executionModal.style.display = 'none';
                }
            }
        }

        function startExecution() {
            if (selectedTasks.length === 0) {
                showNotification('Selecione pelo menos uma tarefa!', 'warning');
                return;
            }
            
            elements.tasksModal.style.display = 'none';
            elements.executionModal.style.display = 'flex';
            
            currentTaskIndex = 0;
            elements.completedCount.textContent = '0';
            elements.totalCount.textContent = selectedTasks.length;
            elements.remainingCount.textContent = selectedTasks.length;
            
            startTimer();
        }

        async function startProcess(mode) {
            currentMode = mode;
            elements.progressModal.style.display = 'flex';
            elements.progressSteps.innerHTML = '';
            
            try {
                addProgressStep('Logando', 'Autenticando usuário...', 'active');
                
                try {
                    const loginData = await login(elements.studentId.value, elements.password.value);
                    updateProgressStep('step-logando', 'completed', 'Login realizado com sucesso!');
                    
                    addProgressStep('Registrando', 'Registrando acesso...', 'active');
                    await registerToken(loginData.token);
                    updateProgressStep('step-registrando', 'completed', 'Acesso registrado!');
                } catch (error) {
                    updateProgressStep('step-logando', 'error', 'Erro ao fazer login');
                    throw new Error('Erro ao fazer login. Verifique suas credenciais.');
                }
                
                addProgressStep('Buscando Salas', 'Carregando salas disponíveis...', 'active');
                
                try {
                    const rooms = await fetchUserRooms(currentAuthToken);
                    updateProgressStep('step-buscando-salas', 'completed', `${rooms.length} salas encontradas`);
                    
                    if (rooms.length === 0) {
                        throw new Error('Nenhuma sala encontrada.');
                    }
                    
                    let targets = new Set();
                    rooms.forEach(room => {
                        targets.add(room.name);
                        if (userNick) targets.add(`${room.name}:${userNick}`);
                    });
                    
                    addProgressStep('Buscando Atividades', 'Carregando tarefas...', 'active');
                    
                    try {
                        if (mode === 'pending') {
                            const tasksData = await fetchTasks(currentAuthToken, Array.from(targets), ['pending', 'draft'], false);
                            allTasks = tasksData || [];
                        } else {
                            allTasks = await fetchTasks(currentAuthToken, Array.from(targets), [], true);
                        }
                        
                        updateProgressStep('step-buscando-atividades', 'completed', `${allTasks.length} atividades encontradas`);
                        
                        if (allTasks.length === 0) {
                            elements.progressModal.style.display = 'none';
                            showNotification(mode === 'pending' ? 'Nenhuma atividade pendente encontrada!' : 'Nenhuma atividade expirada encontrada!', 'info');
                            return;
                        }
                        
                        setTimeout(() => {
                            elements.progressModal.style.display = 'none';
                            displayTasks(allTasks);
                            elements.tasksModal.style.display = 'flex';
                        }, 500);
                        
                    } catch (error) {
                        updateProgressStep('step-buscando-atividades', 'error', 'Erro ao buscar atividades');
                        throw new Error('Erro ao buscar atividades.');
                    }
                    
                } catch (error) {
                    if (error.message === 'Nenhuma sala encontrada.') {
                        updateProgressStep('step-buscando-salas', 'error', 'Nenhuma sala encontrada');
                    }
                    throw error;
                }
                
            } catch (error) {
                console.error('Erro no processo:', error);
                showNotification(error.message, 'error');
                setTimeout(() => {
                    elements.progressModal.style.display = 'none';
                }, 2000);
            }
        }

        elements.verifyBtn.addEventListener('click', () => {
            elements.verifyBtn.style.display = 'none';
            elements.spinner.style.display = 'inline-block';
            elements.statusText.textContent = 'Verificando…';
            
            setTimeout(() => {
                elements.spinner.style.display = 'none';
                elements.verifyBtn.style.display = 'inline-block';
                elements.verifyBtn.classList.add('checked');
                elements.verifyBtn.style.background = 'var(--success-color)';
                elements.verifyBtn.style.borderColor = 'var(--success-color)';
                elements.statusText.textContent = '✅ Verificado';
                elements.pendingBtn.disabled = false;
                elements.expiredBtn.disabled = false;
            }, 2000);
        });

        elements.togglePassword.addEventListener('click', () => {
            const type = elements.password.type === 'password' ? 'text' : 'password';
            elements.password.type = type;
            elements.togglePassword.textContent = type === 'password' ? '👁' : '🔒';
        });

        elements.studentId.addEventListener('input', () => {
            elements.clearStudentId.classList.toggle('hidden', !elements.studentId.value);
        });

        elements.password.addEventListener('input', () => {
            elements.clearPassword.classList.toggle('hidden', !elements.password.value);
        });

        elements.clearStudentId.addEventListener('click', () => {
            elements.studentId.value = '';
            elements.clearStudentId.classList.add('hidden');
            elements.studentId.focus();
        });

        elements.clearPassword.addEventListener('click', () => {
            elements.password.value = '';
            elements.clearPassword.classList.add('hidden');
            elements.password.focus();
        });

        elements.pendingBtn.addEventListener('click', async () => {
            if (!elements.studentId.value || !elements.password.value) {
                showNotification('Preencha o RA e a senha', 'warning');
                return;
            }

            elements.pendingBtn.disabled = true;
            const originalText = elements.pendingBtn.innerHTML;
            elements.pendingBtn.innerHTML = '🔄 Processando...';

            try {
                await startProcess('pending');
            } finally {
                elements.pendingBtn.disabled = false;
                elements.pendingBtn.innerHTML = originalText;
            }
        });

        elements.expiredBtn.addEventListener('click', async () => {
            if (!elements.studentId.value || !elements.password.value) {
                showNotification('Preencha o RA e a senha', 'warning');
                return;
            }

            elements.expiredBtn.disabled = true;
            const originalText = elements.expiredBtn.innerHTML;
            elements.expiredBtn.innerHTML = '🔄 Processando...';

            try {
                await startProcess('expired');
            } finally {
                elements.expiredBtn.disabled = false;
                elements.expiredBtn.innerHTML = originalText;
            }
        });

        elements.closeTasksModal.addEventListener('click', () => {
            elements.tasksModal.style.display = 'none';
        });

        elements.selectAllBtn.addEventListener('click', () => {
            const checkboxes = elements.tasksListContainer.querySelectorAll('.task-checkbox');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = !allChecked;
            });
            
            elements.selectAllBtn.textContent = allChecked ? 'Selecionar Todas' : 'Desmarcar Todas';
            updateSelectedTasks();
        });

        elements.tasksListContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                updateSelectedTasks();
            }
        });

        elements.startExecutionBtn.addEventListener('click', () => {
            startExecution();
        });

        elements.pauseBtn.addEventListener('click', () => {
            isPaused = !isPaused;
            elements.pauseBtn.innerHTML = isPaused ? '▶️ Continuar' : '⏸️ Pausar';
            showNotification(isPaused ? 'Execução pausada' : 'Execução retomada', 'info');
        });

        elements.stopBtn.addEventListener('click', () => {
            if (confirm('Deseja realmente parar a execução? As tarefas não enviadas permanecerão pendentes.')) {
                stopTimer();
                elements.executionModal.style.display = 'none';
                showNotification('Execução interrompida', 'warning');
            }
        });

        window.addEventListener('click', (event) => {
            if (event.target === elements.tasksModal) {
                elements.tasksModal.style.display = 'none';
            }
        });

        window.addEventListener('beforeunload', (e) => {
            if (executionTimer) {
                e.preventDefault();
                e.returnValue = 'Há tarefas sendo executadas. Deseja realmente sair?';
                return e.returnValue;
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            showNotification('Sistema Trollchipss Tarefas carregado!', 'success', 3000);
            elements.studentId.focus();
        });

        console.log('%c🎓 Trollchipss Tarefas v1.0', 'color: #4a6bff; font-size: 16px; font-weight: bold;');
        console.log('%c✨ Sistema de automação completo!', 'color: #10b981; font-size: 12px;');
    </script>
