const scriptCards = document.querySelectorAll('.script-card');
const scriptModals = document.querySelectorAll('.script-modal');

scriptCards.forEach(card => {
    card.addEventListener('click', () => {
        const id = card.getAttribute('data-modal');
        document.getElementById(id).style.display = 'flex';
    });
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.script-modal').style.display = 'none';
    });
});

window.addEventListener('click', e => {
    scriptModals.forEach(m => {
        if (e.target === m) m.style.display = 'none';
    });
});
