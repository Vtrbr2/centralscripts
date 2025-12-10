document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("global-loader");
    const loaderText = document.querySelector(".loader-text");

    /* ============================
       CONTAGEM REGRESSIVA 15s
    ============================ */
    let segundos = 15;

    loaderText.textContent = `Carregando, aguarde ${segundos}s`;

    const intervalo = setInterval(() => {
        segundos--;
        loaderText.textContent = `Carregando, aguarde ${segundos}s`;

        if (segundos <= 0) {
            clearInterval(intervalo);
        }
    }, 1000);



    /* ============================
       SOME AUTOMÁTICO DEPOIS DE 2s
    ============================ */
    setTimeout(() => {
        loader.classList.add("hide");
    }, 15000);



    /* ============================
       ATIVAR LOADER AO CLICAR EM LINKS
    ============================ */
    document.addEventListener("click", e => {
        const el = e.target.closest("a, button[data-loader]");
        if (!el) return;

        // Links internos: (#)
        if (el.tagName === "A" && el.getAttribute("href").startsWith("#")) {
            loader.classList.remove("hide");

            setTimeout(() => {
                loader.classList.add("hide");
            }, 1000);

            return;
        }

        // Links normais → espera 2s e navega
        if (el.tagName === "A") {
            e.preventDefault();
            const href = el.getAttribute("href");

            loader.classList.remove("hide");

            setTimeout(() => {
                window.location.href = href;
            }, 2000);
        }
    });
});
