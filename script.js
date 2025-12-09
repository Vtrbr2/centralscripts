const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
});
// MOSTRA O LOADER POR 4s NA ENTRADA DO SITE
window.addEventListener("load", () => {
    setTimeout(() => {
        document.getElementById("global-loader").classList.add("hide");
    }, 4000);
});

// ATIVA LOADER AO CLICAR EM LINKS OU BOTÕES
document.addEventListener("click", function(e) {
    const el = e.target.closest("a, button[data-loader]");

    if (!el) return;

    // Mostrar loader novamente
    const loader = document.getElementById("global-loader");
    loader.classList.remove("hide");

    // Manter loader por 4 segundos antes de navegar
    if (el.tagName.toLowerCase() === "a") {
        e.preventDefault();
        const href = el.getAttribute("href");

        setTimeout(() => {
            window.location.href = href;
        }, 4000);
    }
});
