// Gerenciamento do Painel de Vendas, Calendário e Planilha de Clientes
let leadsData = JSON.parse(localStorage.getItem('biomev_leads')) || [
    { name: "Prefeitura Municipal", date: "2026-11-01", service: "Inventário Flora", contact: "(32) 99999-9999", lastContact: "2026-11-01", nextContact: "2026-12-05", type: "Follow-up" }
];

function renderLeadsTable() {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    leadsData.forEach((lead, index) => {
        const statusClass = calculateLeadStatus(lead.nextContact);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" value="${lead.name}" onchange="updateLead(${index}, 'name', this.value)"></td>
            <td><input type="date" value="${lead.date}" onchange="updateLead(${index}, 'date', this.value)"></td>
            <td><input type="text" value="${lead.service}" onchange="updateLead(${index}, 'service', this.value)"></td>
            <td><input type="text" value="${lead.contact}" onchange="updateLead(${index}, 'contact', this.value)"></td>
            <td><input type="date" value="${lead.lastContact}" onchange="updateLead(${index}, 'lastContact', this.value)"></td>
            <td><input type="date" value="${lead.nextContact}" onchange="updateLead(${index}, 'nextContact', this.value)"></td>
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
}

function calculateLeadStatus(nextDateStr) {
    if (!nextDateStr) return { class: 'status-green', text: 'Sem data' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(nextDateStr);
    nextDate.setHours(0, 0, 0, 0);

    const diffTime = nextDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Vermelho: Mesma semana (<= 7 dias ou atrasado)
    if (diffDays <= 7) {
        return { class: 'status-red', text: 'Retornar esta semana!' };
    }
    // Amarelo: No mês de retomar contato (entre 8 e 30 dias)
    else if (diffDays <= 30) {
        return { class: 'status-yellow', text: 'Mês de retomar' };
    }
    // Verde: Mais de um mês (> 30 dias)
    else {
        return { class: 'status-green', text: 'Prazo tranquilo (> 1 mês)' };
    }
}

function addLeadRow() {
    const todayStr = new Date().toISOString().split('T')[0];
    leadsData.push({ name: "Novo Cliente", date: todayStr, service: "Consultoria", contact: "", lastContact: todayStr, nextContact: todayStr, type: "Follow-up" });
    saveAndRenderLeads();
}

function updateLead(index, field, value) {
    leadsData[index][field] = value;
    saveAndRenderLeads();
}

function deleteLeadRow(index) {
    leadsData.splice(index, 1);
    saveAndRenderLeads();
}

function saveAndRenderLeads() {
    localStorage.setItem('biomev_leads', JSON.stringify(leadsData));
    renderLeadsTable();
}

// Inicializar aba e tabelas ao carregar
document.addEventListener('DOMContentLoaded', () => {
    renderLeadsTable();

    // Renderizar calendário de vendas caso exista
    const calGrid = document.getElementById('calendarGridVendas');
    if (calGrid && typeof renderCalendar === 'function') {
        renderCalendar('vendas');
    }
});