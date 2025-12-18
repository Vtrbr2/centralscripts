const API_URL = 'https://sala-futuro-backend.onrender.com';

const btnBuscar = document.getElementById('btnBuscar');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');
const raInput = document.getElementById('ra');
const senhaInput = document.getElementById('senha');
const loading = document.getElementById('loading');
const resultado = document.getElementById('resultado');
const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');

function mostrarErro(mensagem) {
    errorDiv.textContent = '❌ ' + mensagem;
    errorDiv.style.display = 'block';
    successDiv.style.display = 'none';
}

function mostrarSucesso(mensagem) {
    successDiv.textContent = '✅ ' + mensagem;
    successDiv.style.display = 'block';
    errorDiv.style.display = 'none';
}

function esconderAlertas() {
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
}

async function buscarBoletim() {
    const ra = raInput.value.trim();
    const senha = senhaInput.value.trim();

    if (!ra || !senha) {
        mostrarErro('Por favor, preencha RA e senha');
        return;
    }

    esconderAlertas();
    btnBuscar.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    loading.style.display = 'block';
    resultado.style.display = 'none';

    try {
        console.log('🔄 Enviando requisição...');

        const response = await fetch(`${API_URL}/api/boletim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ra, senha })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Dados recebidos:', data.data);
            renderizarBoletim(data.data);
            mostrarSucesso('Boletim carregado com sucesso!');
        } else {
            console.error('❌ Erro:', data.error);
            mostrarErro(data.error || 'Erro ao buscar boletim');
            resultado.style.display = 'none';
        }

    } catch (error) {
        console.error('❌ Erro de conexão:', error);
        mostrarErro('Erro ao conectar: ' + error.message);
        resultado.style.display = 'none';
    } finally {
        btnBuscar.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        loading.style.display = 'none';
    }
}

function getNotaClass(nota) {
    if (nota === null || nota === undefined) return 'nota-vazia';
    if (nota >= 6) return 'nota-alta';
    if (nota >= 5) return 'nota-media';
    return 'nota-baixa';
}

function renderizarBoletim(data) {
    // Info do aluno
    document.getElementById('alunoInfo').innerHTML = `
        <h2>👤 ${data.aluno.nome}</h2>
        <p style="color: #94a3b8;">RA: ${data.aluno.ra}</p>
    `;

    // Estatísticas
    const mediaGeral = data.estatisticas.mediaGeral !== null 
        ? data.estatisticas.mediaGeral 
        : '–';

    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${mediaGeral}</div>
            <div class="stat-label">Média Geral</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.estatisticas.totalDisciplinas}</div>
            <div class="stat-label">Disciplinas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.estatisticas.aprovadas}</div>
            <div class="stat-label">Aprovadas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: ${
                data.estatisticas.situacaoGeral === 'Aprovado' ? '#10b981' : '#f59e0b'
            }">
                ${data.estatisticas.situacaoGeral}
            </div>
            <div class="stat-label">Situação</div>
        </div>
    `;

    // Tabela de notas
    const tbody = data.disciplinas.map(d => {
        const renderNota = (bim) => {
            if (!bim || bim.nota === null) {
                return '<td class="nota-vazia">–</td>';
            }
            return `<td class="${getNotaClass(bim.nota)}">${bim.nota}</td>`;
        };

        const renderMedia = (bim) => {
            if (!bim || bim.mediaTurma === null) {
                return '<td class="nota-vazia">–</td>';
            }
            return `<td style="color: #64748b;">${bim.mediaTurma.toFixed(1)}</td>`;
        };

        return `
            <tr>
                <td><strong>${d.nome}</strong></td>
                ${renderNota(d.bimestres[0])}
                ${renderMedia(d.bimestres[0])}
                ${renderNota(d.bimestres[1])}
                ${renderMedia(d.bimestres[1])}
                ${renderNota(d.bimestres[2])}
                ${renderMedia(d.bimestres[2])}
                ${renderNota(d.bimestres[3])}
                ${renderMedia(d.bimestres[3])}
            </tr>
        `;
    }).join('');

    document.getElementById('tabelaBody').innerHTML = tbody;
    resultado.style.display = 'block';
}

btnBuscar.addEventListener('click', buscarBoletim);

senhaInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarBoletim();
});

raInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') senhaInput.focus();
});
