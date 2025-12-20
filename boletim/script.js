const overlay = document.getElementById("system-offline-overlay");
const closeBtn = document.getElementById("closeOffline");

// intercepta QUALQUER clique
document.addEventListener("click", function (e) {
  e.preventDefault();
  overlay.style.display = "flex";
}, true);

// botão "Entendi"
closeBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  overlay.style.display = "none";
});
