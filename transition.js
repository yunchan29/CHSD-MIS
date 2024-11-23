document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("a");

    links.forEach(link => {
        link.addEventListener("click", e => {
            const targetUrl = link.getAttribute("href");

            // Check if the target is an internal link
            if (!targetUrl.startsWith("http") && targetUrl !== "#") {
                e.preventDefault(); // Prevent default navigation

                // Create a semi-transparent loading indicator
                const loadingIndicator = document.createElement("div");
                loadingIndicator.style.position = "fixed";
                loadingIndicator.style.top = "50%";
                loadingIndicator.style.left = "50%";
                loadingIndicator.style.transform = "translate(-50%, -50%)";
                loadingIndicator.style.zIndex = "9999";
                loadingIndicator.style.width = "120px"; // Adjusted container width
                loadingIndicator.style.height = "150px"; // Adjusted container height
                loadingIndicator.style.backgroundColor = "rgba(0, 0, 0, 0.6)"; // Semi-transparent background
                loadingIndicator.style.borderRadius = "10px"; // Rounded edges
                loadingIndicator.style.display = "flex";
                loadingIndicator.style.flexDirection = "column"; // Stack spinner and text vertically
                loadingIndicator.style.alignItems = "center";
                loadingIndicator.style.justifyContent = "center";
                loadingIndicator.innerHTML = `
                    <div class="spinner-container">
                        <div class="spinner"></div>
                        <div class="spinner-inner"></div>
                    </div>
                    <p class="loading-text">Loading<span>.</span><span>.</span><span>.</span></p>
                `;

                document.body.appendChild(loadingIndicator);

                // Animate fade-out with smoother and semi-transparent transition
                gsap.to("body", {
                    opacity: 0.5, // Increased transparency for body fade-out
                    backgroundColor: "rgba(0, 0, 0, 0.4)", // Lighter and more transparent background
                    duration: 0.8, // Adjusted animation speed
                    ease: "power2.inOut", // Smooth easing
                    onComplete: () => {
                        window.location = targetUrl; // Navigate after animation
                    },
                });
            }
        });
    });
});
