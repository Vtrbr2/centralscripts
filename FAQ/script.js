document.addEventListener("DOMContentLoaded", () => {
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(item => {
        const question = item.querySelector(".faq-question");

        question.addEventListener("click", () => {
            // fecha todos os outros
            faqItems.forEach(i => {
                if (i !== item) {
                    i.classList.remove("active");
                }
            });

            // abre/fecha o clicado
            item.classList.toggle("active");
        });
    });
});
