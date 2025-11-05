document.addEventListener('DOMContentLoaded', function() {
    
    // --- Seletores e Constantes Globais ---
    const navItems = document.querySelectorAll('.nav-item');
    const pageContents = document.querySelectorAll('.page-content');
    const pageTitleElement = document.getElementById('page-title');
    
    // Define o endereço base do seu backend Python (app.py)
    const API_URL = 'http://127.0.0.1:8000';

    // --- Funções de Renderização e API ---

    /**
     * Função central de navegação.
     * Gerencia a exibição da página e dispara a busca de dados na API.
     */
    async function showPage(pageId, title) {
        // 1. Oculta todas as páginas
        pageContents.forEach(content => {
            content.classList.remove('active-page');
        });

        // 2. Busca dados dinâmicos da API ANTES de exibir a página
        try {
            switch(pageId) {
                case 'inicio':
                    // (Opcional) Você pode criar um endpoint /api/dashboard para estes dados
                    break;
                case 'pacientes':
                    await loadPacientes();
                    break;
                case 'consultas':
                    // Precisamos dos pacientes para preencher o <select> do formulário
                    await loadPacientesParaFormulario(); 
                    break;
                // Adicione 'cases' para estoque, financeiro, etc.
            }
        } catch (error) {
            console.error(`Falha ao carregar dados para a página ${pageId}:`, error);
            // Aqui você poderia exibir uma mensagem de erro na UI
        }

        // 3. Mostra a página desejada após os dados serem carregados
        const targetPage = document.getElementById('page-' + pageId);
        if (targetPage) {
            targetPage.classList.add('active-page');
            pageTitleElement.textContent = title; // Atualiza o título do cabeçalho
        }
    }

    /**
     * Busca dados de /api/pacientes e preenche a tabela.
     */
    async function loadPacientes() {
        try {
            const response = await fetch(`${API_URL}/api/pacientes`);
            if (!response.ok) throw new Error('Resposta da rede não foi OK');
            const pacientes = await response.json();

            const tableBody = document.querySelector('#page-pacientes .data-table tbody');
            const totalPacientesEl = document.querySelector('#page-pacientes .table-footer p');

            // Limpa a tabela (remove os dados estáticos do HTML)
            tableBody.innerHTML = ''; 

            // Itera sobre os dados da API e cria as linhas da tabela
            pacientes.forEach(paciente => {
                const statusClass = paciente.status === 'Ativo' ? 'active' : 'inactive';
                
                const row = `
                    <tr>
                        <td>${paciente.nome}</td>
                        <td>${paciente.tutor}</td>
                        <td>${paciente.especie}</td>
                        <td>${paciente.raca}</td>
                        <td>(A definir)</td> <td><span class="status-badge ${statusClass}">${paciente.status}</span></td>
                        <td>
                            <button class="action-btn view" data-id="${paciente.id}"><i class="fas fa-eye"></i></button>
                            <button class="action-btn edit" data-id="${paciente.id}"><i class="fas fa-edit"></i></button>
                        </td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });

            // Atualiza a contagem total
            totalPacientesEl.textContent = `Total de Pacientes: ${pacientes.length}`;

        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
            const tableBody = document.querySelector('#page-pacientes .data-table tbody');
            tableBody.innerHTML = `<tr><td colspan="7">Falha ao carregar dados da API. O backend está rodando?</td></tr>`;
        }
    }

    /**
     * Busca pacientes para popular o <select> no formulário de consultas.
     */
    async function loadPacientesParaFormulario() {
        try {
            const response = await fetch(`${API_URL}/api/pacientes`);
            if (!response.ok) throw new Error('Resposta da rede não foi OK');
            
            const pacientes = await response.json();
            const selectPaciente = document.getElementById('paciente-consulta');
            
            // Limpa opções antigas e mantém a padrão
            selectPaciente.innerHTML = '<option value="">Selecione um paciente</option>'; 

            pacientes.forEach(paciente => {
                // Boa prática: Apenas pacientes ativos podem ter consultas agendadas
                if (paciente.status === 'Ativo') {
                    const option = `<option value="${paciente.id}">${paciente.nome} (${paciente.especie} - ${paciente.raca})</option>`;
                    selectPaciente.insertAdjacentHTML('beforeend', option);
                }
            });

        } catch (error) {
            console.error('Erro ao carregar pacientes para o formulário:', error);
        }
    }

    /**
     * Manipula o envio (submit) do formulário de nova consulta.
     */
    async function handleConsultaSubmit(event) {
        event.preventDefault(); // Impede o recarregamento da página

        const form = event.target;
        
        // Coleta os dados do formulário e formata para o Pydantic (Python)
        const consultaData = {
            paciente_id: parseInt(form.querySelector('#paciente-consulta').value, 10),
            veterinario: form.querySelector('#veterinario-consulta').value,
            data: form.querySelector('#data-consulta').value,
            hora: form.querySelector('#hora-consulta').value,
            motivo: form.querySelector('#motivo-consulta').value
        };

        // Validação simples no frontend
        if (!consultaData.paciente_id || !consultaData.data || !consultaData.hora || !consultaData.motivo) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        try {
            // Envia os dados para a API (POST request)
            const response = await fetch(`${API_URL}/api/consultas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(consultaData)
            });

            if (response.status === 201) { // Código 201 (Created)
                alert('Consulta agendada com sucesso!');
                form.reset(); // Limpa o formulário
                // (Opcional) Recarregar a lista de "Histórico Recente"
            } else {
                // Tenta ler a mensagem de erro da API (ex: erro de validação do Pydantic)
                const errorData = await response.json();
                alert(`Falha ao agendar consulta: ${JSON.stringify(errorData.detail)}`);
            }

        } catch (error) {
            console.error('Erro ao enviar consulta:', error);
            alert('Erro de conexão. Não foi possível agendar a consulta.');
        }
    }

    // --- Inicialização dos Event Listeners ---

    // 1. Listeners dos Itens de Navegação (Sidebar)
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); // Previne o comportamento padrão do link

            // Remove a classe 'active' de todos os itens
            navItems.forEach(i => i.classList.remove('active'));

            // Adiciona a classe 'active' ao item clicado
            this.classList.add('active');

            // Obtém o ID da página e o título
            const pageId = this.getAttribute('data-page');
            const pageTitle = this.textContent.trim();
            
            // Exibe a nova página (e busca seus dados)
            showPage(pageId, pageTitle);
        });
    });

    // 2. Listener do Formulário de Consultas
    // Vincula o evento de 'submit' UMA VEZ quando a página carrega
    const consultaForm = document.querySelector('.new-consult-form');
    if (consultaForm) {
        consultaForm.addEventListener('submit', handleConsultaSubmit);
    }
    
    // 3. Carregamento Inicial (Página 'Início')
    // Simula o clique no item 'Início' para carregar a primeira página
    const initialPage = document.querySelector('.nav-item.active');
    if (initialPage) {
        const pageId = initialPage.getAttribute('data-page');
        const pageTitle = initialPage.textContent.trim();
        showPage(pageId, pageTitle);
    }
});
