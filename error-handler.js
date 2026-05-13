// ======================
// 🔥 GLOBAL ERROR HANDLER (SIMPLIFIED)
// ======================

// Captura erros JS globais
window.addEventListener("error", (event) => {
  console.error("Global Error:", event.error);
  showFallbackUI("Something went wrong. Try refreshing.");
});

// Captura promises não tratadas
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Promise Error:", event.reason);
  showFallbackUI("Unexpected error occurred.");
});


// ======================
// 🧯 FALLBACK UI
// ======================
function showFallbackUI(message) {
  let fallback = document.getElementById("error-screen");

  if (!fallback) {
    fallback = document.createElement("div");
    fallback.id = "error-screen";

    fallback.style.cssText = `
      position:fixed;
      top:0;
      left:0;
      width:100%;
      height:100%;
      background:#202225;
      color:white;
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      z-index:9999;
      font-family:Arial;
      text-align:center;
      padding:20px;
    `;

    document.body.appendChild(fallback);
  }

  fallback.innerHTML = `
    <h2>⚠️ System Error</h2>
    <p>${message}</p>
    <button onclick="location.reload()"
      style="padding:10px 20px;background:#5865f2;color:white;border:none;border-radius:6px;cursor:pointer;">
      Reload
    </button>
  `;
}
