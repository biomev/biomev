/* ==========================================
   CONFIGURAÇÃO DA NUVEM (JSONbin.io) - BIOMEV
   ========================================== */
const JSONBIN_BIN_ID = "6af3bb10ac6210605a7e6704";
const JSONBIN_MASTER_KEY = "$2a$10$BtD7QMk6j3JClPIfDBURW.FLSEpP1qijxKujFCc79bRZuu/daHxa";

// Objeto de dados globais na nuvem
let cloudData = {
    team: [],
    notifs: [],
    events: {},
    knowledge: {}
};

let currentUser = {
    name: "",
    role: "Gerente de Marketing",
    password: "",
    photo: "",
    isLoggedIn: false
};

let teamMembers = [];
let notifications = [];
let calendarEvents = {};
let knowledgeData = {};

let selectedMemberId = null;
let pendingLoginMemberId = null;
let selectedCalendarDate = "";
let currentActiveTab = 'marketing';
let currentKnowledgeSection = "";
let activeOpenFolderKey = null;

const novembroHolidays = {
    2: "Finados",
    15: "Proclamação",
    20: "Consciência"
};

// Sincronização com a Nuvem (Carregar)
async function loadFromCloud(isInitial = false) {
    try {
        let response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                "X-Master-Key": JSONBIN_MASTER_KEY
            }
        });
        if (response.ok) {
            let json = await response.json();
            if (json.record && json.record.biomev_payload) {
                cloudData = json.record.biomev_payload;
                teamMembers = cloudData.team || [];
                notifications = cloudData.notifs || [];
                calendarEvents = cloudData.events || {};
                knowledgeData = cloudData.knowledge || {};
            }
        }
    } catch (e) {
        console.error("Erro ao carregar da nuvem:", e);
    }

    if (isInitial) {
        updateNotifDot();
        renderCalendars();
    } else {
        // Atualiza telas ativas periodicamente sem quebrar inputs
        if (typeof renderCalendars === 'function') renderCalendars();
        if (typeof updateNotifDot === 'function') updateNotifDot();
    }
}

// Sincronização com a Nuvem (Salvar)
async function saveToCloud() {
    cloudData.team = teamMembers;
    cloudData.notifs = notifications;
    cloudData.events = calendarEvents;
    cloudData.knowledge = knowledgeData;

    try {
        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": JSONBIN_MASTER_KEY
            },
            body: JSON.stringify({ biomev_payload: cloudData })
        });
    } catch (e) {
        console.error("Erro ao salvar na nuvem:", e);
    }
}

function openTab(tabName) {
    currentActiveTab = tabName;
    const contents = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-button');
    const subtitle = document.getElementById('header-subtitle');
    const profileView = document.getElementById('profileView');

    if (profileView) profileView.classList.remove('active');

    document.querySelectorAll('.tool-container').forEach(tool => {
        tool.classList.remove('active');
    });

    const marketingMenu = document.getElementById('marketing-menu');
    const vendasMenu = document.getElementById('vendas-menu');
    if (marketingMenu) marketingMenu.style.display = 'block';
    if (vendasMenu) vendasMenu.style.display = 'block';

    contents.forEach(content => content.classList.remove('active'));
    buttons.forEach(button => button.classList.remove('active'));

    const targetTab = document.getElementById(tabName);
    if (targetTab) targetTab.classList.add('active');

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    if (tabName === 'marketing') {
        if (subtitle) subtitle.innerText = "Painel de Marketing";
    } else {
        if (subtitle) subtitle.innerText = "Painel de Vendas";
    }
}

function openTool(toolName) {
    const marketingMenu = document.getElementById('marketing-menu');
    const vendasMenu = document.getElementById('vendas-menu');

    if (toolName === 'certificado' && marketingMenu) {
        marketingMenu.style.display = 'none';
    }
    if (toolName === 'pipeline-leads' && vendasMenu) {
        vendasMenu.style.display = 'none';
    }

    const toolContainer = document.getElementById(`tool-${toolName}`);
    if (toolContainer) toolContainer.classList.add('active');
    if (toolName === 'certificado') renderCertificate();
}

function closeTool(toolName) {
    const marketingMenu = document.getElementById('marketing-menu');
    const vendasMenu = document.getElementById('vendas-menu');

    const toolContainer = document.getElementById(`tool-${toolName}`);
    if (toolContainer) toolContainer.classList.remove('active');

    if (toolName === 'certificado' && marketingMenu) {
        marketingMenu.style.display = 'block';
    }
    if (toolName === 'pipeline-leads' && vendasMenu) {
        vendasMenu.style.display = 'block';
    }
}

function openKnowledgeTool(sectionTheme, sectionName) {
    currentKnowledgeSection = sectionName;
    activeOpenFolderKey = null;

    const mktMenu = document.getElementById('marketing-menu');
    const vdsMenu = document.getElementById('vendas-menu');
    if (mktMenu) mktMenu.style.display = 'none';
    if (vdsMenu) vdsMenu.style.display = 'none';

    if (sectionTheme === 'marketing') {
        document.getElementById('tool-knowledge-marketing').classList.add('active');
        document.getElementById('knowledgeTitleMkt').innerText = `Gestão de Conhecimento: ${sectionName}`;
        document.getElementById('folderMainAreaMkt').style.display = 'block';
        document.getElementById('folderViewMkt').style.display = 'none';
        document.getElementById('newFolderNameMkt').value = "";
        renderFoldersGrid('marketing');
    } else {
        document.getElementById('tool-knowledge-vendas').classList.add('active');
        document.getElementById('knowledgeTitleVds').innerText = `Gestão de Conhecimento: ${sectionName}`;
        document.getElementById('folderMainAreaVds').style.display = 'block';
        document.getElementById('folderViewVds').style.display = 'none';
        document.getElementById('newFolderNameVds').value = "";
        renderFoldersGrid('vendas');
    }
}

function closeKnowledgeTool(sectionTheme) {
    if (sectionTheme === 'marketing') {
        document.getElementById('tool-knowledge-marketing').classList.remove('active');
        document.getElementById('marketing-menu').style.display = 'block';
    } else {
        document.getElementById('tool-knowledge-vendas').classList.remove('active');
        document.getElementById('vendas-menu').style.display = 'block';
    }
}

function createFolder(sectionTheme) {
    let inputId = sectionTheme === 'marketing' ? 'newFolderNameMkt' : 'newFolderNameVds';
    let folderName = document.getElementById(inputId).value.trim();

    if (!folderName) {
        alert("Digite o nome da pasta.");
        return;
    }

    let fullKey = `${currentKnowledgeSection}_${folderName}`;
    if (!knowledgeData[fullKey]) {
        knowledgeData[fullKey] = [];
        saveToCloud();
    }

    document.getElementById(inputId).value = "";
    renderFoldersGrid(sectionTheme);
}

function renderFoldersGrid(sectionTheme) {
    let containerId = sectionTheme === 'marketing' ? 'foldersContainerMkt' : 'foldersContainerVds';
    const container = document.getElementById(containerId);

    let keys = Object.keys(knowledgeData).filter(k => k.startsWith(currentKnowledgeSection));

    if (keys.length === 0) {
        container.innerHTML = `<p style="font-size:0.9rem; color:var(--text-muted); text-align:center; padding: 20px; grid-column: 1 / -1;">Nenhuma pasta criada ainda. Use o campo acima para adicionar.</p>`;
        return;
    }

    let folderColor = sectionTheme === 'marketing' ? '#85a4be' : '#739569';

    let html = '';
    keys.forEach(key => {
        let folderName = key.replace(`${currentKnowledgeSection}_`, '');

        let folderSvg = `
            <svg class="folder-real-svg" viewBox="0 0 100 80">
                <path d="M4 12 C4 8, 8 4, 16 4 L38 4 C44 4, 48 8, 52 14 L92 14 C96 14, 96 18, 96 22 L96 72 C96 76, 92 80, 88 80 L12 80 C8 80, 4 76, 4 72 Z" fill="${folderColor}" opacity="0.65"></path>
                <path d="M0 24 C0 20, 4 16, 8 16 L92 16 C96 16, 100 20, 100 24 L100 72 C100 76, 96 80, 92 80 L8 80 C4 80, 0 76, 0 72 Z" fill="${folderColor}"></path>
            </svg>
        `;

        html += `
            <div class="folder-real-item" onclick="openFolder('${key}', '${folderName}', '${sectionTheme}')">
                <button class="folder-real-delete" onclick="deleteFolder('${key}', '${sectionTheme}', event)">X</button>
                ${folderSvg}
                <span class="folder-real-name">${folderName}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

function deleteFolder(folderKey, sectionTheme, event) {
    event.stopPropagation();
    if (confirm("Deseja realmente excluir esta pasta e seus arquivos?")) {
        delete knowledgeData[folderKey];
        saveToCloud();
        renderFoldersGrid(sectionTheme);
    }
}

function openFolder(folderKey, folderName, sectionTheme) {
    activeOpenFolderKey = folderKey;
    if (sectionTheme === 'marketing') {
        document.getElementById('folderMainAreaMkt').style.display = 'none';
        document.getElementById('folderViewMkt').style.display = 'block';
        document.getElementById('currentFolderNameMkt').innerText = `Pasta: ${folderName}`;
        renderFilesInFolder('marketing');
    } else {
        document.getElementById('folderMainAreaVds').style.display = 'none';
        document.getElementById('folderViewVds').style.display = 'block';
        document.getElementById('currentFolderNameVds').innerText = `Pasta: ${folderName}`;
        renderFilesInFolder('vendas');
    }
}

function backToFolders(sectionTheme) {
    activeOpenFolderKey = null;
    if (sectionTheme === 'marketing') {
        document.getElementById('folderViewMkt').style.display = 'none';
        document.getElementById('folderMainAreaMkt').style.display = 'block';
        renderFoldersGrid('marketing');
    } else {
        document.getElementById('folderViewVds').style.display = 'none';
        document.getElementById('folderMainAreaVds').style.display = 'block';
        renderFoldersGrid('vendas');
    }
}

function handleFileUpload(event, sectionTheme) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        let fileData = {
            name: file.name,
            type: file.type,
            url: e.target.result
        };

        if (!knowledgeData[activeOpenFolderKey]) knowledgeData[activeOpenFolderKey] = [];
        knowledgeData[activeOpenFolderKey].push(fileData);
        saveToCloud();

        renderFilesInFolder(sectionTheme);
        event.target.value = "";
    };
    reader.readAsDataURL(file);
}

function renderFilesInFolder(sectionTheme) {
    let containerId = sectionTheme === 'marketing' ? 'filesContainerMkt' : 'filesContainerVds';
    const container = document.getElementById(containerId);
    let files = knowledgeData[activeOpenFolderKey] || [];

    if (files.length === 0) {
        container.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding: 20px; grid-column: 1 / -1;">Nenhum arquivo enviado nesta pasta ainda.</p>`;
        return;
    }

    let html = '';
    files.forEach((file, idx) => {
        let previewHtml = '';
        if (file.type && file.type.startsWith('video/')) {
            previewHtml = `<video src="${file.url}" muted></video>`;
        } else if (file.url) {
            previewHtml = `<img src="${file.url}" alt="${file.name}">`;
        } else {
            previewHtml = `<span>Arquivo</span>`;
        }

        html += `
            <div class="gallery-card">
                <div class="gallery-preview">
                    ${previewHtml}
                </div>
                <div class="gallery-info">
                    <span class="gallery-filename" title="${file.name}">${file.name}</span>
                    <button class="gallery-delete-btn" onclick="removeFileFromFolder(${idx}, '${sectionTheme}')">Excluir</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function removeFileFromFolder(fileIndex, sectionTheme) {
    knowledgeData[activeOpenFolderKey].splice(fileIndex, 1);
    saveToCloud();
    renderFilesInFolder(sectionTheme);
}

/* RENDERIZAÇÃO DOS CALENDÁRIOS */
function renderCalendars() {
    renderFilteredCalendar('calendarGridMarketing', 'event-blue', 'Marketing');
    renderFilteredCalendar('calendarGridVendas', 'event-green', 'Vendas');
}

function renderFilteredCalendar(gridId, eventClass, calendarType) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    let headers = `
        <div class="cal-day-header">Dom</div>
        <div class="cal-day-header">Seg</div>
        <div class="cal-day-header">Ter</div>
        <div class="cal-day-header">Qua</div>
        <div class="cal-day-header">Qui</div>
        <div class="cal-day-header">Sex</div>
        <div class="cal-day-header">Sáb</div>
    `;

    let html = headers;
    for (let day = 1; day <= 30; day++) {
        let dateStr = `${day < 10 ? '0' + day : day}/11/2026`;
        let isHoliday = novembroHolidays[day];

        let tasksForThisDay = [];

        if (calendarEvents[dateStr]) {
            calendarEvents[dateStr].forEach(ev => {
                if (ev.type === calendarType || ev.type === 'Diretor') {
                    tasksForThisDay.push(ev.title);
                }
            });
        }

        teamMembers.forEach(m => {
            if (m.tasks) {
                m.tasks.forEach(t => {
                    if (t.date === dateStr && t.status !== "Concluída") {
                        let matchesType = false;
                        if (calendarType === 'Marketing' && (m.role === 'Gerente de Marketing' || m.role === 'Diretor de Marketing e Vendas')) matchesType = true;
                        if (calendarType === 'Vendas' && (m.role === 'Gerente de Vendas' || m.role === 'Diretor de Marketing e Vendas')) matchesType = true;

                        if (matchesType && !tasksForThisDay.includes(t.title)) {
                            tasksForThisDay.push(t.title);
                        }
                    }
                });
            }
        });

        let cellClass = "";
        let subText = "";

        if (isHoliday) {
            cellClass = "holiday";
            subText = isHoliday;
        } else if (tasksForThisDay.length > 0) {
            cellClass = eventClass;
            subText = tasksForThisDay[0];
        }

        html += `
            <div class="cal-cell ${cellClass}" onclick="openCalendarEventModal('${dateStr}')">
                <span>${day}</span>
                <span class="cal-label-sub">${subText}</span>
            </div>
        `;
    }
    grid.innerHTML = html;
}

function openCalendarEventModal(dateStr) {
    selectedCalendarDate = dateStr;
    document.getElementById('calModalTitle').innerText = `Adicionar em ${dateStr} (${currentActiveTab.toUpperCase()})`;
    document.getElementById('calTaskTitle').value = "";
    document.getElementById('calTaskDesc').value = "";

    const select = document.getElementById('calTaskMember');
    let allowedMembers = teamMembers.filter(m => {
        if (currentUser.role === 'Diretor de Marketing e Vendas') return true;
        if (currentActiveTab === 'marketing' && (m.role === 'Gerente de Marketing' || m.role === 'Diretor de Marketing e Vendas')) return true;
        if (currentActiveTab === 'vendas' && (m.role === 'Gerente de Vendas' || m.role === 'Diretor de Marketing e Vendas')) return true;
        return false;
    });

    if (allowedMembers.length === 0) {
        select.innerHTML = `<option value="">Nenhum membro compatível com este setor</option>`;
    } else {
        let opts = '';
        allowedMembers.forEach(m => {
            opts += `<option value="${m.name}">${m.name} (${m.role})</option>`;
        });
        select.innerHTML = opts;
    }

    document.getElementById('calEventModal').classList.add('active');
}

function closeCalendarModal() {
    document.getElementById('calEventModal').classList.remove('active');
}

function saveCalendarTask() {
    const title = document.getElementById('calTaskTitle').value.trim();
    const desc = document.getElementById('calTaskDesc').value.trim();
    const assignedMember = document.getElementById('calTaskMember').value;

    if (!title) {
        alert("Digite o título do evento/tarefa.");
        return;
    }

    let eventSectionType = currentActiveTab === 'marketing' ? 'Marketing' : 'Vendas';
    if (currentUser.role === 'Diretor de Marketing e Vendas') {
        eventSectionType = 'Diretor';
    }

    if (!calendarEvents[selectedCalendarDate]) {
        calendarEvents[selectedCalendarDate] = [];
    }
    calendarEvents[selectedCalendarDate].push({ title, member: assignedMember, type: eventSectionType });

    if (assignedMember) {
        let memberObj = teamMembers.find(m => m.name === assignedMember);
        if (memberObj) {
            if (!memberObj.tasks) memberObj.tasks = [];
            memberObj.tasks.push({
                title: title,
                desc: desc || `Atribuído via Calendário (${selectedCalendarDate})`,
                date: selectedCalendarDate,
                file: null,
                status: "Pendente"
            });
            addNotification(`Nova tarefa atribuída a ${assignedMember} para o dia ${selectedCalendarDate}: "${title}"`);
        }
    }

    saveToCloud();
    closeCalendarModal();
    renderCalendars();
    alert("Tarefa salva no calendário e integrada ao perfil!");
}

function saveNewTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const desc = document.getElementById('taskDesc').value.trim();
    const date = document.getElementById('taskDate').value.trim();
    const memberName = document.getElementById('taskMemberSelect').value;

    if (!title || !date) {
        alert("Insira o nome e a data limite da tarefa.");
        return;
    }

    let targetMember = teamMembers.find(m => m.name === memberName) || teamMembers.find(m => m.name === currentUser.name);

    if (targetMember) {
        if (!targetMember.tasks) targetMember.tasks = [];
        targetMember.tasks.push({
            title,
            desc: desc || "Sem descrição",
            date,
            file: null,
            status: "Pendente"
        });
    }

    addNotification(`Nova tarefa criada para ${targetMember ? targetMember.name : 'Equipe'}: "${title}" (${date})`);
    saveToCloud();
    toggleTaskModal(false);
    renderTasksGrid();
    renderCalendars();
}

/* Gestão de Perfil */
function handleProfileClick() {
    if (!currentUser.isLoggedIn) {
        if (teamMembers.length > 0) openSelectProfileModal();
        else openRegisterModal();
    } else {
        showProfileView();
    }
}

function openSelectProfileModal() {
    const list = document.getElementById('selectProfileList');
    let html = '';
    teamMembers.forEach(m => {
        html += `
            <div class="team-member-row" style="cursor: pointer;" onclick="promptProfilePassword(${m.id})">
                <div class="team-member-header-info">
                    <div class="team-member-info">
                        <h4>${m.name}</h4>
                        <p>${m.role}</p>
                    </div>
                    <button class="btn-small-action">Entrar</button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
    document.getElementById('selectProfileModal').classList.add('active');
}

function toggleSelectProfileModal(show) {
    const modal = document.getElementById('selectProfileModal');
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
}

function promptProfilePassword(memberId) {
    pendingLoginMemberId = memberId;
    let member = teamMembers.find(m => m.id === memberId);
    document.getElementById('loginProfileTitle').innerText = `Senha para: ${member.name}`;
    document.getElementById('loginPasswordInput').value = "";
    toggleSelectProfileModal(false);
    document.getElementById('passwordModal').classList.add('active');
}

function closePasswordModal() {
    document.getElementById('passwordModal').classList.remove('active');
    openSelectProfileModal();
}

function verifyProfilePassword() {
    const passwordInput = document.getElementById('loginPasswordInput').value;
    let member = teamMembers.find(m => m.id === pendingLoginMemberId);

    if (member) {
        if (member.password !== passwordInput) {
            alert("Senha incorreta!");
            return;
        }
        currentUser.name = member.name;
        currentUser.role = member.role;
        currentUser.password = member.password;
        currentUser.photo = member.photo || "";
        currentUser.isLoggedIn = true;

        updateHeaderAvatar(member.name, member.photo);
        document.getElementById('passwordModal').classList.remove('active');
        showProfileView();
        updateNotifDot();
    }
}

function openRegisterModalFromSelect() {
    toggleSelectProfileModal(false);
    openRegisterModal();
}

function openRegisterModal() {
    document.getElementById('authModalTitle').innerText = "Cadastre-se no Painel";
    document.getElementById('passwordLabel').innerText = "Senha de Acesso";
    document.getElementById('inputName').value = "";
    document.getElementById('inputRole').value = "Gerente de Marketing";
    document.getElementById('inputPassword').value = "";
    document.getElementById('inputPhotoFile').value = "";
    toggleAuthModal(true);
}

function openEditProfileModal() {
    document.getElementById('authModalTitle').innerText = "Editar Perfil";
    document.getElementById('passwordLabel').innerText = "Mudar Senha";
    document.getElementById('inputName').value = currentUser.name;
    document.getElementById('inputRole').value = currentUser.role;
    document.getElementById('inputPassword').value = currentUser.password || "";
    document.getElementById('inputPhotoFile').value = "";
    toggleAuthModal(true);
}

function toggleAuthModal(show) {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
}

function updateHeaderAvatar(name, photo) {
    const trigger = document.getElementById('profileTrigger');
    const avatarText = document.getElementById('profileAvatarText');

    if (photo) {
        trigger.classList.add('logged-in');
        avatarText.innerHTML = `<img src="${photo}" alt="Foto">`;
        trigger.style.backgroundColor = "transparent";
    } else {
        trigger.classList.remove('logged-in');
        const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        avatarText.innerText = initials;
        trigger.style.backgroundColor = "var(--vanilla)";
    }
}

function saveProfileData() {
    const nameInput = document.getElementById('inputName').value.trim();
    const roleInput = document.getElementById('inputRole').value;
    const passInput = document.getElementById('inputPassword').value.trim();
    const photoFileInput = document.getElementById('inputPhotoFile');

    if (!nameInput || !passInput) {
        alert('Por favor, preencha o nome e a senha.');
        return;
    }

    const finalizeSave = (photoDataUrl) => {
        currentUser.name = nameInput;
        currentUser.role = roleInput;
        currentUser.password = passInput;
        if (photoDataUrl) currentUser.photo = photoDataUrl;
        currentUser.isLoggedIn = true;

        let existingIndex = teamMembers.findIndex(m => m.name.toLowerCase() === nameInput.toLowerCase());
        if (existingIndex >= 0) {
            teamMembers[existingIndex].role = roleInput;
            teamMembers[existingIndex].password = passInput;
            if (photoDataUrl) teamMembers[existingIndex].photo = photoDataUrl;
        } else {
            teamMembers.push({
                id: Date.now(),
                name: nameInput,
                role: roleInput,
                password: passInput,
                photo: currentUser.photo || "",
                tasks: []
            });
        }
        saveToCloud();

        updateHeaderAvatar(nameInput, currentUser.photo);
        toggleAuthModal(false);
        showProfileView();
        updateNotifDot();
    };

    if (photoFileInput.files && photoFileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) { finalizeSave(e.target.result); };
        reader.readAsDataURL(photoFileInput.files[0]);
    } else {
        finalizeSave(currentUser.photo || "");
    }
}

function showProfileView() {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

    const mainTabNav = document.getElementById('mainTabNav');
    const headerSubtitle = document.getElementById('header-subtitle');
    const profileBigAvatar = document.getElementById('profileBigAvatar');
    const viewUserName = document.getElementById('viewUserName');
    const viewUserRole = document.getElementById('viewUserRole');
    const profileView = document.getElementById('profileView');

    if (mainTabNav) mainTabNav.style.display = 'none';
    if (headerSubtitle) headerSubtitle.innerText = "Meu Perfil";

    if (viewUserName) viewUserName.innerText = currentUser.name;
    if (viewUserRole) viewUserRole.innerText = currentUser.role;

    if (profileBigAvatar) {
        if (currentUser.photo) {
            profileBigAvatar.innerHTML = `<img src="${currentUser.photo}" alt="Foto">`;
        } else {
            const initials = currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
            profileBigAvatar.innerText = initials;
        }
    }

    renderTasksGrid();
    if (profileView) profileView.classList.add('active');
}

function closeProfile() {
    const profileView = document.getElementById('profileView');
    const mainTabNav = document.getElementById('mainTabNav');
    if (profileView) profileView.classList.remove('active');
    if (mainTabNav) mainTabNav.style.display = 'flex';
    openTab('marketing');
}

function openAddTaskModal() {
    if (!currentUser.isLoggedIn) {
        alert("Cadastre-se primeiro para gerenciar tarefas.");
        return;
    }
    document.getElementById('taskTitle').value = "";
    document.getElementById('taskDesc').value = "";
    document.getElementById('taskDate').value = "";

    const select = document.getElementById('taskMemberSelect');
    let opts = `<option value="${currentUser.name}">Eu (${currentUser.name})</option>`;
    teamMembers.forEach(m => {
        if (m.name !== currentUser.name) opts += `<option value="${m.name}">${m.name}</option>`;
    });
    select.innerHTML = opts;

    document.getElementById('taskModal').classList.add('active');
}

function toggleTaskModal(show) {
    const modal = document.getElementById('taskModal');
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
}

function renderTasksGrid() {
    const pendingContainer = document.getElementById('tasksGridContainer');
    const completedContainer = document.getElementById('completedTasksGridContainer');

    let member = teamMembers.find(m => m.name === currentUser.name);
    if (!member) return;

    let pendingTasks = member.tasks ? member.tasks.filter(t => t.status !== "Concluída") : [];
    let completedTasks = member.tasks ? member.tasks.filter(t => t.status === "Concluída") : [];

    if (pendingContainer) {
        if (pendingTasks.length === 0) {
            pendingContainer.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">Nenhuma tarefa pendente no momento.</p>`;
        } else {
            let html = '';
            member.tasks.forEach((t, idx) => {
                if (t.status !== "Concluída") {
                    html += `
                        <div class="task-square-card">
                            <div>
                                <div class="task-square-top">
                                    <h4>${t.title}</h4>
                                    <span class="task-date-tag">${t.date}</span>
                                </div>
                                <p class="task-square-desc">${t.desc}</p>
                            </div>
                            <div class="task-square-footer">
                                <span class="task-status-pill">${t.status}</span>
                                <button style="background:none; border:none; cursor:pointer; font-size:0.75rem; color:#166534; font-weight:700;" onclick="completeTask(${idx})">Concluir</button>
                            </div>
                        </div>
                    `;
                }
            });
            pendingContainer.innerHTML = html;
        }
    }

    if (completedContainer) {
        if (completedTasks.length === 0) {
            completedContainer.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">Nenhuma tarefa concluída guardada.</p>`;
        } else {
            let html = '';
            member.tasks.forEach((t, idx) => {
                if (t.status === "Concluída") {
                    html += `
                        <div class="task-square-card" style="opacity: 0.85; background: #f8fafc;">
                            <div>
                                <div class="task-square-top">
                                    <h4 style="text-decoration: line-through; color: var(--text-muted);">${t.title}</h4>
                                    <span class="task-date-tag">${t.date}</span>
                                </div>
                                <p class="task-square-desc">${t.desc}</p>
                            </div>
                            <div class="task-square-footer">
                                <span class="task-status-pill" style="background:#dcfce7; color:#166534;">Concluída</span>
                                <button style="background:none; border:none; cursor:pointer; font-size:0.75rem; color:#e74c3c; font-weight:700;" onclick="deleteCompletedTask(${idx})">Apagar</button>
                            </div>
                        </div>
                    `;
                }
            });
            completedContainer.innerHTML = html;
        }
    }
}

function completeTask(index) {
    let member = teamMembers.find(m => m.name === currentUser.name);
    if (member && member.tasks[index]) {
        member.tasks[index].status = "Concluída";
        saveToCloud();
        renderTasksGrid();
        renderCalendars();
    }
}

function deleteCompletedTask(index) {
    let member = teamMembers.find(m => m.name === currentUser.name);
    if (member && member.tasks) {
        member.tasks.splice(index, 1);
        saveToCloud();
        renderTasksGrid();
    }
}

function openTeamModal() {
    const list = document.getElementById('teamMemberList');
    if (teamMembers.length === 0) {
        list.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">Nenhum membro cadastrado.</p>`;
    } else {
        let html = '';
        teamMembers.forEach(m => {
            let btnBg = "var(--glaucous)";
            let btnColor = "#ffffff";
            if (m.role === 'Gerente de Vendas') {
                btnBg = "var(--moss-green)";
            } else if (m.role === 'Diretor de Marketing e Vendas') {
                btnBg = "var(--vanilla)";
                btnColor = "#5c5314";
            }

            html += `
                <div class="team-member-row">
                    <div class="team-member-header-info">
                        <div class="team-member-info">
                            <h4>${m.name}</h4>
                            <p>${m.role}</p>
                        </div>
                        <button class="btn-small-action" style="background-color: ${btnBg}; color: ${btnColor};" onclick="openMemberAction(${m.id})">Gerenciar</button>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    }
    document.getElementById('teamModal').classList.add('active');
}

function toggleTeamModal(show) {
    const modal = document.getElementById('teamModal');
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
}

function openMemberAction(memberId) {
    selectedMemberId = memberId;
    toggleTeamModal(false);

    document.getElementById('memberMessage').value = "";
    document.getElementById('memberTaskTitle').value = "";
    document.getElementById('memberTaskDesc').value = "";
    document.getElementById('memberTaskDate').value = "";

    renderMemberTasksInModal();
    document.getElementById('memberActionModal').classList.add('active');
}

function closeMemberActionModal() {
    document.getElementById('memberActionModal').classList.remove('active');
    openTeamModal();
}

function switchMemberTab(tab) {
    const btnMsg = document.getElementById('tabBtnMsg');
    const btnTask = document.getElementById('tabBtnTask');
    const btnList = document.getElementById('tabBtnList');

    const paneMsg = document.getElementById('paneMsg');
    const paneTask = document.getElementById('paneTask');
    const paneList = document.getElementById('paneList');

    btnMsg.classList.remove('active');
    btnTask.classList.remove('active');
    btnList.classList.remove('active');

    paneMsg.classList.remove('active');
    paneTask.classList.remove('active');
    paneList.classList.remove('active');

    if (tab === 'msg') {
        btnMsg.classList.add('active');
        paneMsg.classList.add('active');
    } else if (tab === 'task') {
        btnTask.classList.add('active');
        paneTask.classList.add('active');
    } else if (tab === 'list') {
        btnList.classList.add('active');
        paneList.classList.add('active');
        renderMemberTasksInModal();
    }
}

function renderMemberTasksInModal() {
    const container = document.getElementById('memberTasksListContainer');
    let member = teamMembers.find(m => m.id === selectedMemberId);

    if (!member || !member.tasks || member.tasks.length === 0) {
        container.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center;">Este membro não possui tarefas ativas no momento.</p>`;
        return;
    }

    let html = '';
    member.tasks.forEach((t, idx) => {
        html += `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px 14px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h5 style="font-size:0.85rem; font-weight:700; color:var(--text-dark);">${t.title} (${t.date})</h5>
                    <p style="font-size:0.75rem; color:var(--text-muted);">${t.desc}</p>
                </div>
                <button style="background:none; border:none; cursor:pointer; font-size:0.75rem; color:#e74c3c; font-weight:700;" onclick="removeMemberTaskFromModal(${idx})">Remover</button>
            </div>
        `;
    });
    container.innerHTML = html;
}

function removeMemberTaskFromModal(taskIndex) {
    let member = teamMembers.find(m => m.id === selectedMemberId);
    if (member && member.tasks) {
        member.tasks.splice(taskIndex, 1);
        saveToCloud();
        renderMemberTasksInModal();
        renderCalendars();
    }
}

function submitMemberMessage() {
    let msgText = document.getElementById('memberMessage').value.trim();
    if (!msgText) return;
    let member = teamMembers.find(m => m.id === selectedMemberId);
    addNotification(`Mensagem para ${member.name}: "${msgText}"`);
    alert("Mensagem enviada!");
    closeMemberActionModal();
}

function submitMemberTask() {
    let title = document.getElementById('memberTaskTitle').value.trim();
    let desc = document.getElementById('memberTaskDesc').value.trim();
    let date = document.getElementById('memberTaskDate').value.trim();

    if (!title || !date) {
        alert("Preencha o título e a data da tarefa.");
        return;
    }

    let member = teamMembers.find(m => m.id === selectedMemberId);
    if (member) {
        if (!member.tasks) member.tasks = [];
        member.tasks.push({
            title,
            desc: desc || "Sem descrição",
            date,
            file: null,
            status: "Pendente"
        });
    }

    addNotification(`Tarefa atribuída a ${member.name}: "${title}" (${date})`);
    saveToCloud();
    alert("Tarefa atribuída com sucesso e integrada ao calendário!");
    closeMemberActionModal();
    renderCalendars();
}

function addNotification(text) {
    if (!currentUser || !currentUser.isLoggedIn) return;

    notifications.unshift({
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        readBy: []
    });
    saveToCloud();
    updateNotifDot();
}

function updateNotifDot() {
    const dot = document.getElementById('notifDot');
    if (!dot) return;

    if (!currentUser || !currentUser.isLoggedIn) {
        dot.textContent = '';
        dot.classList.remove('active');
        return;
    }

    let unreadNotifs = notifications.filter(n => {
        if (!n.readBy) n.readBy = [];
        return !n.readBy.includes(currentUser.name);
    });

    if (unreadNotifs.length > 0) {
        dot.textContent = unreadNotifs.length;
        dot.classList.add('active');
    } else {
        dot.textContent = '';
        dot.classList.remove('active');
    }
}

function openNotificationsModal() {
    const list = document.getElementById('notificationsList');

    if (!currentUser || !currentUser.isLoggedIn) {
        list.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">Faça login para ver suas notificações.</p>`;
        document.getElementById('notificationsModal').classList.add('active');
        return;
    }

    if (notifications.length === 0) {
        list.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">Nenhuma notificação.</p>`;
    } else {
        let html = '';
        notifications.forEach(n => {
            html += `<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:12px; font-size:0.8rem; margin-bottom: 8px;"><p style="font-weight:700;">${n.text}</p><span style="font-size:0.7rem; color:var(--text-muted);">${n.time}</span></div>`;
        });
        list.innerHTML = html;
    }

    notifications.forEach(n => {
        if (!n.readBy) n.readBy = [];
        if (!n.readBy.includes(currentUser.name)) {
            n.readBy.push(currentUser.name);
        }
    });
    saveToCloud();

    const dot = document.getElementById('notifDot');
    if (dot) {
        dot.classList.remove('active');
        dot.textContent = '';
    }

    document.getElementById('notificationsModal').classList.add('active');
}

function toggleNotificationsModal(show) {
    const modal = document.getElementById('notificationsModal');
    if (show) {
        openNotificationsModal();
    } else {
        if (modal) modal.classList.remove('active');
    }
}

// Inicialização e polling de sincronização em tempo real com carregamento visual garantido
document.addEventListener("DOMContentLoaded", async () => {
    // Aguarda carregar da nuvem e força a renderização imediata
    await loadFromCloud(true);

    if (typeof renderCalendars === 'function') renderCalendars();

    // Intervalo de verificação em nuvem para sincronizar alterações feitas por outros dispositivos
    setInterval(async () => {
        await loadFromCloud(false);
    }, 5000);
});