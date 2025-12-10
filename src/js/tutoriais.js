
const modal = document.getElementById("videoModal");
const videoFrame = document.getElementById("videoFrame");
const closeVideo = document.getElementById("closeVideo");

document.querySelectorAll(".video-card").forEach(card => {
    card.addEventListener("click", () => {
        const link = card.getAttribute("data-video");
        videoFrame.src = link + "?autoplay=1";
        modal.style.display = "flex";
    });
});

closeVideo.addEventListener("click", () => {
    modal.style.display = "none";
    videoFrame.src = "";
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
        videoFrame.src = "";
    }
});
