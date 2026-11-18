// Gerenciamento do Painel de Vendas, Calendário, Planilha e CRM Visual
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
        if (!lead.stage) {
            lead.stage = 'contato';
        }
        if (typeof lead.value !== 'number') {
            lead.value = parseFloat(lead.value) || 0;
        }
    });
}

// Sobrescreve/complementa o openTool para esconder o vendas-menu ao abrir o CRM Visual
const originalOpenTool = window.openTool || function () { };
window.openTool = function (toolName) {
    if (toolName === 'kanban-vendas') {
        const vendasMenu = document.getElementById('vendas-menu');
        if (vendasMenu) vendasMenu.style.display = 'none';
        const toolContainer = document.getElementById(`tool-kanban-vendas`);
        if (toolContainer) toolContainer.classList.add('active');
        renderKanbanBoard();
        return;
    }
    originalOpenTool(toolName);
};

const originalCloseTool = window.closeTool || function () { };
window.closeTool = function (toolName) {
    if (toolName === 'kanban-vendas') {
        const toolContainer = document.getElementById(`tool-kanban-vendas`);
        if (toolContainer) toolContainer.classList.remove('active');
        const vendasMenu = document.getElementById('vendas-menu');
        if (vendasMenu) vendasMenu.style.display = 'block';
        return;
    }
    originalCloseTool(toolName);
};

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
            if (stage.id !== 'perdido') {
                totalPipeline += (parseFloat(l.value) || 0);
            }
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

function dragKanbanCard(event, index) {
    draggedLeadIndex = index;
}

function allowDrop(event) {
    event.preventDefault();
}

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
    let escolha = prompt(`Mover "${lead.name}" para qual etapa?\n\nDigite o ID da etapa:\n${optionsStr}`, lead.stage);

    if (escolha && kanbanStages.some(s => s.id === escolha.trim())) {
        lead.stage = escolha.trim();
        await saveAndRenderLeads();
    }
}

async function openAddKanbanCardModal() {
    let name = prompt("Nome do Cliente / Empresa:");
    if (!name) return;
    let service = prompt("Serviço desejado (ex: Inventário de Flora):", "Consultoria Ambiental");
    let contact = prompt("Telefone ou E-mail de contato:", "(32) ");
    let valueStr = prompt("Valor estimado do contrato (R$):", "1500");
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
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function calculateLeadStatus(nextDateStr) {
    if (!nextDateStr) return { class: 'status-green', text: 'Sem data' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(nextDateStr + 'T00:00:00');
    nextDate.setHours(0, 0, 0, 0);

    const diffTime = nextDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
        return { class: 'status-red', text: 'Retornar esta semana!' };
    } else if (diffDays <= 30) {
        return { class: 'status-yellow', text: 'Mês de retomar' };
    } else {
        return { class: 'status-green', text: 'Prazo tranquilo (> 1 mês)' };
    }
}

async function addLeadRow() {
    const todayStr = new Date().toISOString().split('T')[0];
    leadsData.push({
        name: "Novo Cliente",
        date: todayStr,
        service: "Consultoria",
        contact: "",
        lastContact: todayStr,
        nextContact: todayStr,
        type: "Follow-up",
        stage: "contato",
        value: 1000
    });
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

    if (typeof cloudData !== 'undefined') {
        cloudData.leads = leadsData;
    }

    if (typeof saveToCloud === 'function') {
        await saveToCloud();
    }

    renderLeadsTable();
}

function ensureExcelExportButton() {
    const table = document.getElementById('leadsTable');
    if (!table) return;

    const existingButtons = document.querySelectorAll('#btnExportLeadsExcel, #btnExportLeadsExcelWrapper');
    existingButtons.forEach((el) => el.remove());

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

    const headers = [
        "Nome do Cliente",
        "Data",
        "Serviço",
        "Contato",
        "Último Contato",
        "Próximo Contato",
        "Característica / Status",
        "Situação do Prazo"
    ];

    const today = new Date().toISOString().slice(0, 10);

    if (typeof ExcelJS !== 'undefined') {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'BIOMEV';
        const sheet = workbook.addWorksheet('Clientes_BIOMEV', {
            views: [{ state: 'frozen', ySplit: 3 }]
        });

        sheet.mergeCells('A1:H1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = 'BIOMEV — Planilha de Clientes e Contatos (Vendas)';
        titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFF3E5AB' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF243C2C' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        sheet.getRow(1).height = 32;

        sheet.mergeCells('A2:H2');
        const subCell = sheet.getCell('A2');
        subCell.value = `Gerado em ${formatDateBr(today)} • Total de registros: ${leadsData.length}`;
        subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF243C2C' } };
        subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6DF' } };
        subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        sheet.getRow(2).height = 20;

        const headerRow = sheet.addRow(headers);
        headerRow.height = 28;
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F4F3A' } };
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF1E3326' } },
                bottom: { style: 'medium', color: { argb: 'FFD4AF37' } },
                left: { style: 'thin', color: { argb: 'FF1E3326' } },
                right: { style: 'thin', color: { argb: 'FF1E3326' } }
            };
        });

        leadsData.forEach((lead, idx) => {
            const status = calculateLeadStatus(lead.nextContact);
            const rowValues = [
                lead.name || "",
                formatDateBr(lead.date),
                lead.service || "",
                lead.contact || "",
                formatDateBr(lead.lastContact),
                formatDateBr(lead.nextContact),
                lead.type || "",
                status.text
            ];

            const row = sheet.addRow(rowValues);
            row.height = 22;
            const rowBg = idx % 2 === 1 ? 'FFEBF2ED' : 'FFFFFFFF';

            row.eachCell((cell, colNumber) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
                cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: colNumber === 1 || colNumber === 3 || colNumber === 7 ? 'left' : 'center',
                    wrapText: true
                };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                };

                if (colNumber === 8) {
                    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
                    if (status.class === 'status-red') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF991B1B' } };
                    } else if (status.class === 'status-yellow') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
                        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF92400E' } };
                    } else {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
                        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF166534' } };
                    }
                }
            });
        });

        sheet.columns.forEach((col, index) => {
            let maxLen = headers[index].length;
            col.eachCell({ includeEmpty: false }, (cell) => {
                if (cell.row < 3) return;
                const valLen = String(cell.value || '').length;
                if (valLen > maxLen) maxLen = valLen;
            });
            col.width = Math.min(Math.max(maxLen + 6, 16), 44);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Clientes_Contatos_BIOMEV_${today}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
    }

    const rows = leadsData.map((lead) => {
        const status = calculateLeadStatus(lead.nextContact);
        return [
            lead.name || "",
            formatDateBr(lead.date),
            lead.service || "",
            lead.contact || "",
            formatDateBr(lead.lastContact),
            formatDateBr(lead.nextContact),
            lead.type || "",
            status.text
        ];
    });

    if (typeof XLSX !== 'undefined') {
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes_BIOMEV");
        XLSX.writeFile(workbook, `Clientes_Contatos_BIOMEV_${today}.xlsx`);
        return;
    }

    const csvLines = [headers, ...rows]
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
        .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvLines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clientes_Contatos_BIOMEV_${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Inicializar aba e tabelas ao carregar
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof loadFromCloud === 'function') {
        await loadFromCloud(true);
        hydrateLeadsFromCloud();
    }

    renderLeadsTable();
    ensureExcelExportButton();

    setInterval(() => {
        if (typeof cloudData !== 'undefined' && Array.isArray(cloudData.leads)) {
            const currentJson = JSON.stringify(leadsData);
            const cloudJson = JSON.stringify(cloudData.leads);
            if (currentJson !== cloudJson) {
                leadsData = cloudData.leads;
                localStorage.setItem('biomev_leads', cloudJson);
                renderLeadsTable();
            }
        }
    }, 5000);

    const calGrid = document.getElementById('calendarGridVendas');
    if (calGrid && typeof renderCalendar === 'function') {
        renderCalendar('vendas');
    }
});