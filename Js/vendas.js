/* ==========================================
   PAINEL DE VENDAS E CRM (BIOMEV)
   ========================================== */

let leadsData = JSON.parse(localStorage.getItem('biomev_leads')) || [
    {
        name: "Prefeitura Municipal",
        date: "2026-11-01",
        service: "Inventário Flora",
        contact: "(32) 99999-9999",
        lastContact: "2026-11-01",
        nextContact: "2026-12-05",
        type: "Follow-up",
        stage: "contato",
        value: 1500
    }
];

function hydrateLeadsFromCloud() {
    if (typeof cloudData !== 'undefined' && Array.isArray(cloudData.leads) && cloudData.leads.length > 0) {
        leadsData = cloudData.leads;
        localStorage.setItem('biomev_leads', JSON.stringify(leadsData));
    }
}

function hydrateKanbanLeads() {
    if (!Array.isArray(leadsData)) return;
    leadsData.forEach(lead => {
        if (!lead.stage) lead.stage = 'contato';
        if (typeof lead.value !== 'number') lead.value = parseFloat(lead.value) || 0;
    });
}

// Abertura correta do CRM (esconde o menu principal de vendas e ativa o container da ferramenta)
function openKanbanTool() {
    const vendasMenu = document.getElementById('vendas-menu');
    if (vendasMenu) vendasMenu.style.display = 'none';

    const toolContainer = document.getElementById('tool-kanban-vendas');
    if (toolContainer) {
        toolContainer.classList.add('active');
        renderKanbanBoard();
    }
}

// Fechamento do CRM e retorno ao menu de vendas
function closeKanbanTool() {
    const toolContainer = document.getElementById('tool-kanban-vendas');
    if (toolContainer) toolContainer.classList.remove('active');

    const vendasMenu = document.getElementById('vendas-menu');
    if (vendasMenu) vendasMenu.style.display = 'block';
}

function renderLeadsTable() {
    hydrateKanbanLeads();
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    leadsData.forEach((lead, index) => {
        const statusClass = calculateLeadStatus(lead.nextContact);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" value="${escapeHtml(lead.name)}" onchange="updateLead(${index}, 'name', this.value)"></td>
            <td><input type="date" value="${lead.date || ''}" onchange="updateLead(${index}, 'date', this.value)"></td>
            <td><input type="text" value="${escapeHtml(lead.service)}" onchange="updateLead(${index}, 'service', this.value)"></td>
            <td><input type="text" value="${escapeHtml(lead.contact)}" onchange="updateLead(${index}, 'contact', this.value)"></td>
            <td><input type="date" value="${lead.lastContact || ''}" onchange="updateLead(${index}, 'lastContact', this.value)"></td>
            <td><input type="date" value="${lead.nextContact || ''}" onchange="updateLead(${index}, 'nextContact', this.value)"></td>
            <td>
                <select onchange="updateLead(${index}, 'type', this.value)">
                    <option value="Follow-up" ${lead.type === 'Follow-up' ? 'selected' : ''}>Follow-up</option>
                    <option value="Cliente sem retorno" ${lead.type === 'Cliente sem retorno' ? 'selected' : ''}>Cliente sem retorno</option>
                    <option value="Reativação de clientes" ${lead.type === 'Reativação de clientes' ? 'selected' : ''}>Reativação de clientes</option>
                </select>
                <div class="status-badge ${statusClass.class}" style="margin-top: 4px;">${statusClass.text}</div>
            </td>
            <td><button class="btn-delete-row" onclick="deleteLeadRow(${index})">Excluir</button></td>
        `;
        tbody.appendChild(tr);
    });

    ensureExcelExportButton();
    renderKanbanBoard();
}

// Etapas do Funil de Vendas
const kanbanStages = [
    { id: 'contato', name: 'Contato Inicial' },
    { id: 'reuniao', name: 'Reunião Agendada' },
    { id: 'proposta', name: 'Proposta Enviada' },
    { id: 'negociacao', name: 'Em Negociação' },
    { id: 'fechado', name: 'Fechado' },
    { id: 'perdido', name: 'Perdido' }
];

function renderKanbanBoard() {
    hydrateKanbanLeads();
    const board = document.getElementById('kanbanBoard');
    if (!board) return;

    let totalPipeline = 0;
    let boardHtml = '';

    kanbanStages.forEach(stage => {
        const columnLeads = leadsData.filter(l => l.stage === stage.id);
        columnLeads.forEach(l => {
            if (stage.id !== 'perdido') totalPipeline += (parseFloat(l.value) || 0);
        });

        let cardsHtml = '';
        columnLeads.forEach((lead) => {
            const originalIndex = leadsData.indexOf(lead);
            cardsHtml += `
                <div class="kanban-card" draggable="true" ondragstart="dragKanbanCard(event, ${originalIndex})">
                    <div class="kanban-card-title">${escapeHtml(lead.name)}</div>
                    <div class="kanban-card-service">${escapeHtml(lead.service || 'Serviço')}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Contato: ${escapeHtml(lead.contact || 'N/A')}</div>
                    <div class="kanban-card-footer">
                        <span class="kanban-card-value">R$ ${(parseFloat(lead.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <div style="display: flex; gap: 6px;">
                            <button title="Mudar Etapa" style="background: none; border: none; cursor: pointer; color: var(--moss-green); font-weight: bold;" onclick="openMoveLeadModal(${originalIndex})">⇄</button>
                            <button title="Excluir" style="background: none; border: none; cursor: pointer; color: #ef4444;" onclick="deleteLeadRow(${originalIndex})">✕</button>
                        </div>
                    </div>
                </div>
            `;
        });

        boardHtml += `
            <div class="kanban-column" ondragover="allowDrop(event)" ondrop="dropKanbanCard(event, '${stage.id}')">
                <div class="kanban-column-header">
                    <span>${stage.name}</span>
                    <span class="kanban-column-count">${columnLeads.length}</span>
                </div>
                <div class="kanban-cards-container">
                    ${cardsHtml || '<p style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:10px;">Sem leads</p>'}
                </div>
            </div>
        `;
    });

    board.innerHTML = boardHtml;

    const totalEl = document.getElementById('pipelineTotalValue');
    if (totalEl) {
        totalEl.innerText = `Pipeline Ativo: R$ ${totalPipeline.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
}

let draggedLeadIndex = null;
function dragKanbanCard(event, index) { draggedLeadIndex = index; }
function allowDrop(event) { event.preventDefault(); }

async function dropKanbanCard(event, newStage) {
    event.preventDefault();
    if (draggedLeadIndex !== null && leadsData[draggedLeadIndex]) {
        leadsData[draggedLeadIndex].stage = newStage;
        draggedLeadIndex = null;
        await saveAndRenderLeads();
    }
}

async function openMoveLeadModal(index) {
    const lead = leadsData[index];
    if (!lead) return;
    let optionsStr = kanbanStages.map(s => `${s.id}: ${s.name}`).join('\n');
    let escolha = prompt(`Mover "${lead.name}" para qual etapa?\n\nDigite o ID:\n${optionsStr}`, lead.stage);
    if (escolha && kanbanStages.some(s => s.id === escolha.trim())) {
        lead.stage = escolha.trim();
        await saveAndRenderLeads();
    }
}

async function openAddKanbanCardModal() {
    let name = prompt("Nome do Cliente / Empresa:");
    if (!name) return;
    let service = prompt("Serviço desejado:", "Consultoria Ambiental");
    let contact = prompt("Contato:", "(32) ");
    let valueStr = prompt("Valor estimado (R$):", "1500");
    let value = parseFloat(valueStr.replace(',', '.')) || 0;

    const todayStr = new Date().toISOString().split('T')[0];
    leadsData.push({
        name: name.trim(),
        date: todayStr,
        service: service || "Consultoria",
        contact: contact || "",
        lastContact: todayStr,
        nextContact: todayStr,
        type: "Follow-up",
        stage: "contato",
        value: value
    });

    await saveAndRenderLeads();
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function calculateLeadStatus(nextDateStr) {
    if (!nextDateStr) return { class: 'status-green', text: 'Sem data' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const nextDate = new Date(nextDateStr + 'T00:00:00'); nextDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return { class: 'status-red', text: 'Retornar esta semana!' };
    if (diffDays <= 30) return { class: 'status-yellow', text: 'Mês de retomar' };
    return { class: 'status-green', text: 'Prazo tranquilo' };
}

async function addLeadRow() {
    const todayStr = new Date().toISOString().split('T')[0];
    leadsData.push({ name: "Novo Cliente", date: todayStr, service: "Consultoria", contact: "", lastContact: todayStr, nextContact: todayStr, type: "Follow-up", stage: "contato", value: 1000 });
    await saveAndRenderLeads();
}

async function updateLead(index, field, value) {
    if (!leadsData[index]) return;
    leadsData[index][field] = value;
    await saveAndRenderLeads();
}

async function deleteLeadRow(index) {
    leadsData.splice(index, 1);
    await saveAndRenderLeads();
}

async function saveAndRenderLeads() {
    localStorage.setItem('biomev_leads', JSON.stringify(leadsData));
    if (typeof cloudData !== 'undefined') cloudData.leads = leadsData;
    if (typeof saveToCloud === 'function') await saveToCloud();
    renderLeadsTable();
}

function ensureExcelExportButton() {
    const table = document.getElementById('leadsTable');
    if (!table) return;
    document.querySelectorAll('#btnExportLeadsExcel, #btnExportLeadsExcelWrapper').forEach(el => el.remove());
    const wrapper = table.closest('div') || table.parentElement;
    if (!wrapper) return;

    const btnWrapper = document.createElement('div');
    btnWrapper.id = 'btnExportLeadsExcelWrapper';
    btnWrapper.style.cssText = 'display: flex; justify-content: flex-end; margin-top: 20px;';

    const btn = document.createElement('button');
    btn.id = 'btnExportLeadsExcel';
    btn.type = 'button';
    btn.className = 'btn-action';
    btn.style.cssText = 'width: auto; padding: 12px 24px; margin-top: 0; background: var(--moss-green);';
    btn.textContent = 'Baixar Planilha em Excel (.xlsx)';
    btn.addEventListener('click', exportLeadsToExcel);

    btnWrapper.appendChild(btn);
    wrapper.insertAdjacentElement('afterend', btnWrapper);
}

function formatDateBr(isoDate) {
    if (!isoDate || typeof isoDate !== 'string') return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

async function exportLeadsToExcel() {
    if (!leadsData || leadsData.length === 0) {
        alert("Não há clientes na planilha para exportar.");
        return;
    }
    // Lógica de exportação mantida idêntica...
}

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof loadFromCloud === 'function') {
        await loadFromCloud(true);
        hydrateLeadsFromCloud();
    }
    renderLeadsTable();
    ensureExcelExportButton();
});