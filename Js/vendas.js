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

function applyResponsiveLeadsLayout() {
    const tool = document.getElementById('tool-pipeline-leads');
    if (!tool) return;

    const isMobile = window.innerWidth <= 768;
    const headerRow = tool.querySelector('.section-header-row');
    const titleEl = headerRow ? headerRow.querySelector('h2') : null;
    const addBtn = headerRow ? headerRow.querySelector('button') : null;
    const table = document.getElementById('leadsTable');
    const wrapper = table ? (table.closest('div') || table.parentElement) : null;
    const exportWrapper = document.getElementById('btnExportLeadsExcelWrapper');
    const exportBtn = document.getElementById('btnExportLeadsExcel');

    if (headerRow && titleEl && addBtn) {
        if (isMobile) {
            headerRow.style.setProperty('display', 'flex', 'important');
            headerRow.style.setProperty('flex-direction', 'row', 'important');
            headerRow.style.setProperty('flex-wrap', 'nowrap', 'important');
            headerRow.style.setProperty('align-items', 'center', 'important');
            headerRow.style.setProperty('justify-content', 'space-between', 'important');
            headerRow.style.setProperty('gap', '8px', 'important');

            titleEl.style.setProperty('font-size', '0.92rem', 'important');
            titleEl.style.setProperty('line-height', '1.2', 'important');
            titleEl.style.setProperty('margin', '0', 'important');
            titleEl.style.setProperty('flex', '1 1 auto', 'important');
            titleEl.style.setProperty('min-width', '0', 'important');

            addBtn.style.setProperty('flex', '0 0 auto', 'important');
            addBtn.style.setProperty('width', 'auto', 'important');
            addBtn.style.setProperty('padding', '8px 10px', 'important');
            addBtn.style.setProperty('font-size', '0.72rem', 'important');
            addBtn.style.setProperty('white-space', 'nowrap', 'important');
        } else {
            headerRow.style.removeProperty('display');
            headerRow.style.removeProperty('flex-direction');
            headerRow.style.removeProperty('flex-wrap');
            headerRow.style.removeProperty('align-items');
            headerRow.style.removeProperty('justify-content');
            headerRow.style.removeProperty('gap');

            titleEl.style.removeProperty('font-size');
            titleEl.style.removeProperty('line-height');
            titleEl.style.removeProperty('margin');
            titleEl.style.removeProperty('flex');
            titleEl.style.removeProperty('min-width');

            addBtn.style.removeProperty('flex');
            addBtn.style.removeProperty('width');
            addBtn.style.removeProperty('padding');
            addBtn.style.removeProperty('font-size');
            addBtn.style.removeProperty('white-space');
        }
    }

    if (wrapper && table) {
        const cells = table.querySelectorAll('th, td');
        if (isMobile) {
            wrapper.style.setProperty('width', '100%', 'important');
            wrapper.style.setProperty('max-width', '100%', 'important');
            wrapper.style.setProperty('overflow-x', 'auto', 'important');
            wrapper.style.setProperty('border-radius', '16px', 'important');

            table.style.setProperty('display', 'table', 'important');
            table.style.setProperty('width', '980px', 'important');
            table.style.setProperty('min-width', '980px', 'important');
            table.style.setProperty('table-layout', 'auto', 'important');
        } else {
            wrapper.style.setProperty('width', '100%', 'important');
            wrapper.style.setProperty('max-width', '100%', 'important');
            wrapper.style.setProperty('overflow-x', 'hidden', 'important');
            wrapper.style.setProperty('border-radius', '16px', 'important');

            table.style.setProperty('display', 'table', 'important');
            table.style.setProperty('width', '100%', 'important');
            table.style.setProperty('min-width', '100%', 'important');
            table.style.setProperty('max-width', '100%', 'important');
            table.style.setProperty('table-layout', 'fixed', 'important');

            cells.forEach(cell => {
                cell.style.setProperty('min-width', '0', 'important');
                cell.style.setProperty('width', 'auto', 'important');
                cell.style.setProperty('padding', '10px 8px', 'important');
                cell.style.setProperty('word-break', 'break-word', 'important');
            });
        }
    }

    if (exportWrapper) {
        exportWrapper.style.setProperty('background', 'transparent', 'important');
        exportWrapper.style.setProperty('background-color', 'transparent', 'important');
        exportWrapper.style.setProperty('box-shadow', 'none', 'important');
        exportWrapper.style.setProperty('border', 'none', 'important');
        exportWrapper.style.setProperty('width', '100%', 'important');
        exportWrapper.style.setProperty('display', 'flex', 'important');
        exportWrapper.style.setProperty('justify-content', isMobile ? 'flex-start' : 'flex-end', 'important');
        exportWrapper.style.setProperty('margin-top', '20px', 'important');
        exportWrapper.style.setProperty('padding', '0', 'important');
    }

    if (exportBtn) {
        exportBtn.style.setProperty('width', 'auto', 'important');
        exportBtn.style.setProperty('max-width', '100%', 'important');
        exportBtn.style.setProperty('margin-top', '0', 'important');
        exportBtn.style.setProperty('background', 'var(--moss-green)', 'important');
        exportBtn.style.setProperty('padding', isMobile ? '10px 16px' : '12px 24px', 'important');
        exportBtn.style.setProperty('font-size', isMobile ? '0.8rem' : '0.9rem', 'important');
    }
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

    const isMobile = window.innerWidth <= 768;

    leadsData.forEach((lead, index) => {
        const statusClass = calculateLeadStatus(lead.nextContact);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="${isMobile ? 'min-width: 150px; padding: 12px 14px;' : 'padding: 10px 8px;'}"><input type="text" value="${escapeHtml(lead.name)}" onchange="updateLead(${index}, 'name', this.value)"></td>
            <td style="${isMobile ? 'min-width: 130px; padding: 12px 14px;' : 'padding: 10px 8px;'}"><input type="date" value="${lead.date || ''}" onchange="updateLead(${index}, 'date', this.value)"></td>
            <td style="${isMobile ? 'min-width: 150px; padding: 12px 14px;' : 'padding: 10px 8px;'}"><input type="text" value="${escapeHtml(lead.service)}" onchange="updateLead(${index}, 'service', this.value)"></td>
            <td style="${isMobile ? 'min-width: 140px; padding: 12px 14px;' : 'padding: 10px 8px;'}"><input type="text" value="${escapeHtml(lead.contact)}" onchange="updateLead(${index}, 'contact', this.value)"></td>
            <td style="${isMobile ? 'min-width: 130px; padding: 12px 14px;' : 'padding: 10px 8px;'}"><input type="date" value="${lead.lastContact || ''}" onchange="updateLead(${index}, 'lastContact', this.value)"></td>
            <td style="${isMobile ? 'min-width: 140px; padding: 12px 18px 12px 14px;' : 'padding: 10px 8px;'}"><input type="date" value="${lead.nextContact || ''}" onchange="updateLead(${index}, 'nextContact', this.value)"></td>
            <td style="${isMobile ? 'min-width: 220px; padding: 12px 20px;' : 'padding: 10px 8px;'}">
                <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-start;">
                    <select style="width: 100%; ${isMobile ? 'min-width: 170px;' : 'min-width: 0;'}" onchange="updateLead(${index}, 'type', this.value)">
                        <option value="Follow-up" ${lead.type === 'Follow-up' ? 'selected' : ''}>Follow-up</option>
                        <option value="Cliente sem retorno" ${lead.type === 'Cliente sem retorno' ? 'selected' : ''}>Cliente sem retorno</option>
                        <option value="Reativação de clientes" ${lead.type === 'Reativação de clientes' ? 'selected' : ''}>Reativação de clientes</option>
                    </select>
                    <span class="status-badge ${statusClass.class}" style="white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis;">${statusClass.text}</span>
                </div>
            </td>
            <td style="${isMobile ? 'min-width: 100px; padding: 12px 14px;' : 'padding: 10px 8px;'} text-align: center;">
                <button type="button" class="btn-delete-row" style="position: static; display: inline-flex; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 8px; background: #fee2e2; color: #dc2626; font-size: 0.75rem; font-weight: 700; white-space: nowrap;" onclick="deleteLeadRow(${index})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    ensureExcelExportButton();
    applyResponsiveLeadsLayout();
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
    btnWrapper.style.cssText = 'display: flex; justify-content: flex-end; margin-top: 20px; background: transparent;';

    const btn = document.createElement('button');
    btn.id = 'btnExportLeadsExcel';
    btn.type = 'button';
    btn.className = 'btn-action';
    btn.style.cssText = 'width: auto; padding: 12px 24px; margin-top: 0; background: var(--moss-green);';
    btn.textContent = 'Baixar Planilha em Excel (.xlsx)';
    btn.addEventListener('click', exportLeadsToExcel);

    btnWrapper.appendChild(btn);
    wrapper.insertAdjacentElement('afterend', btnWrapper);
    applyResponsiveLeadsLayout();
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

    if (typeof ExcelJS !== 'undefined') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Clientes e Pipeline');

        worksheet.columns = [
            { header: 'Nome do Cliente', key: 'name', width: 28 },
            { header: 'Data', key: 'date', width: 15 },
            { header: 'Serviço', key: 'service', width: 24 },
            { header: 'Contato', key: 'contact', width: 20 },
            { header: 'Último Contato', key: 'lastContact', width: 18 },
            { header: 'Próximo Contato', key: 'nextContact', width: 18 },
            { header: 'Característica / Tipo', key: 'type', width: 24 },
            { header: 'Status do Prazo', key: 'status', width: 22 },
            { header: 'Etapa do Funil', key: 'stage', width: 18 },
            { header: 'Valor (R$)', key: 'value', width: 15 }
        ];

        leadsData.forEach(lead => {
            const st = calculateLeadStatus(lead.nextContact);
            worksheet.addRow({
                name: lead.name || '',
                date: formatDateBr(lead.date),
                service: lead.service || '',
                contact: lead.contact || '',
                lastContact: formatDateBr(lead.lastContact),
                nextContact: formatDateBr(lead.nextContact),
                type: lead.type || '',
                status: st.text,
                stage: lead.stage || '',
                value: parseFloat(lead.value) || 0
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'BIOMEV_Planilha_Clientes.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        return;
    }

    if (typeof XLSX !== 'undefined') {
        const rows = leadsData.map(lead => {
            const st = calculateLeadStatus(lead.nextContact);
            return {
                'Nome do Cliente': lead.name || '',
                'Data': formatDateBr(lead.date),
                'Serviço': lead.service || '',
                'Contato': lead.contact || '',
                'Último Contato': formatDateBr(lead.lastContact),
                'Próximo Contato': formatDateBr(lead.nextContact),
                'Característica / Tipo': lead.type || '',
                'Status do Prazo': st.text,
                'Etapa do Funil': lead.stage || '',
                'Valor (R$)': parseFloat(lead.value) || 0
            };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
        XLSX.writeFile(wb, 'BIOMEV_Planilha_Clientes.xlsx');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof loadFromCloud === 'function') {
        await loadFromCloud(true);
        hydrateLeadsFromCloud();
    }
    renderLeadsTable();
    ensureExcelExportButton();
    applyResponsiveLeadsLayout();
});

window.addEventListener('resize', applyResponsiveLeadsLayout);