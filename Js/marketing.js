let certBgImage = new Image();
certBgImage.src = "imagens/certificado.jpeg";

certBgImage.onload = function () {
    renderCertificate();
};

function updateTemplateText() {
    const role = document.getElementById('roleSelect').value;
    const type = document.getElementById('eventType').value;
    const name = document.getElementById('eventName').value;
    const date = document.getElementById('eventDate').value;
    const hours = document.getElementById('eventHours').value;

    let text = `${role} ${type} "${name}", realizada em ${date}, com carga horária total de ${hours} horas.`;
    document.getElementById('certDetails').value = text;
}

let customNamePosY = 360;
let customTextPosY = 500;

function adjustPosition(type, delta) {
    if (type === 'name') {
        customNamePosY += delta;
    } else if (type === 'text') {
        customTextPosY += delta;
    }
    renderCertificate();
}

function renderCertificate() {
    const canvas = document.getElementById('certCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (certBgImage.complete && certBgImage.naturalWidth !== 0) {
        ctx.drawImage(certBgImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#fdfbf7";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#85a4be";
        ctx.lineWidth = 10;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

        ctx.fillStyle = "#002747";
        ctx.font = "bold 32px 'Poppins', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("BIOMEV - EMPRESA JÚNIOR", canvas.width / 2, 120);
    }

    // Nome do Participante (Cor: #43AF22, Poppins, Maiúsculo)
    const studentNameInput = document.getElementById('studentName').value || "Nome do Participante";
    const studentName = studentNameInput.toUpperCase();
    const fontSize = document.getElementById('nameFontSize').value || 100;

    ctx.fillStyle = "#43AF22";
    ctx.font = `bold ${fontSize}px 'Poppins', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(studentName, canvas.width / 2, customNamePosY);

    // Texto descritivo (Cor: #002747, Poppins, com tamanho dinâmico)
    const details = document.getElementById('certDetails').value;
    const textFontSize = document.getElementById('textFontSize').value || 24;
    const lineHeight = parseInt(textFontSize) + 12;

    ctx.fillStyle = "#002747";
    ctx.font = `${textFontSize}px 'Poppins', sans-serif`;
    ctx.textAlign = "center";

    wrapText(ctx, details, canvas.width / 2, customTextPosY, canvas.width - 250, lineHeight);
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const canvas = document.getElementById('certCanvas');
    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1200, 850]
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, 1200, 850);

    // Pega o nome digitado, coloca em maiúsculo e remove caracteres especiais para o nome do arquivo
    let rawName = document.getElementById('studentName').value || "certificado";
    let fileName = rawName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_") + ".pdf";

    pdf.save(fileName);
}

document.addEventListener("DOMContentLoaded", () => {
    updateTemplateText();
    setTimeout(renderCertificate, 300);
});