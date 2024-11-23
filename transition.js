document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("a");

    links.forEach(link => {
        link.addEventListener("click", e => {
            const targetUrl = link.getAttribute("href");

            // Process only internal links, ignoring external links and "#" placeholders
            if (targetUrl && !targetUrl.startsWith("http") && targetUrl !== "#") {
                e.preventDefault(); // Prevent default navigation

                // Create and style the loading indicator
                const loadingIndicator = document.createElement("div");
                Object.assign(loadingIndicator.style, {
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: "9999",
                    width: "120px",
                    height: "150px",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "14px",
                    textAlign: "center",
                });

                loadingIndicator.innerHTML = `
                    <div class="spinner-container">
                        <div class="spinner"></div>
                        <div class="spinner-inner"></div>
                    </div>
                    <p class="loading-text">Loading<span>.</span><span>.</span><span>.</span></p>
                `;

                document.body.appendChild(loadingIndicator);

                // Fade-out animation using GSAP
                gsap.to("body", {
                    opacity: 0.5,
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    duration: 0.8,
                    ease: "power2.inOut",
                    onComplete: () => {
                        window.location = targetUrl; // Navigate to the target URL
                    },
                });
            }
        });
    });
});
