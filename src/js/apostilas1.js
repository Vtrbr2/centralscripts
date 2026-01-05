class ApostilasApp {
    constructor() {
        this.apiUrl = "https://books-api-blush.vercel.app/api/apostilas";
        this.init();
    }

    init() {
        this.loadApostilas();
    }

    async loadApostilas() {
        try {
            this.showLoading();

            const response = await fetch(this.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            this.renderFundamental(data);
            this.renderMedio(data);
        } catch (error) {
            console.error("Erro ao carregar apostilas:", error);
            this.showError();
        }
    }

    showLoading() {
        const html = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Carregando apostilas...</p>
            </div>
        `;

        const fundamental = document.getElementById("ensino-fundamental");
        const medio = document.getElementById("ensino-medio");

        if (fundamental) fundamental.innerHTML = html;
        if (medio) medio.innerHTML = html;
    }

    showError() {
        const html = `<p>Erro ao carregar apostilas.</p>`;

        const fundamental = document.getElementById("ensino-fundamental");
        const medio = document.getElementById("ensino-medio");

        if (fundamental) fundamental.innerHTML = html;
        if (medio) medio.innerHTML = html;
    }

    renderFundamental(data) {
        const container = document.getElementById("ensino-fundamental");
        if (!container) return;

        const anos = ["6ano", "7ano", "8ano", "9ano"];
        container.innerHTML = this.buildGrades(data, anos);
    }

    renderMedio(data) {
        const container = document.getElementById("ensino-medio");
        if (!container) return;

        const anos = ["1ano", "2ano", "3ano"];
        container.innerHTML = this.buildGrades(data, anos);
    }

    buildGrades(data, anos) {
        return `
            <div class="grade-cards">
                ${anos.map(ano => {
                    const grade = data[ano];
                    if (!grade) return "";

                    return `
                        <div class="grade-card">
                            <h3>${grade.title}</h3>
                            <span>${grade.totalApostilas} apostilas</span>
                            ${this.buildVolumes(grade.volumes)}
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }

    buildVolumes(volumes) {
        return Object.keys(volumes).map(key => {
            const volume = volumes[key];

            return `
                <div class="volume-section">
                    <h4>${volume.title}</h4>
                    <div class="books-list">
                        ${volume.books.map(book => `
                            <a href="${book.url}" target="_blank" class="book-item">
                                📄 ${book.title}
                            </a>
                        `).join("")}
                    </div>
                </div>
            `;
        }).join("");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new ApostilasApp();
});
