
// 🔥 Captura erros JS globais
window.addEventListener("error", (event) => {
  console.error("Global Error:", event.error);

  showFallbackUI("Something went wrong. Try refreshing.");
});

// 🔥 Captura promises não tratadas
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Promise Error:", event.reason);

  showFallbackUI("Unexpected error occurred.");
});


// ======================
// 🧯 UI DE FALLBACK
// ======================
function showFallbackUI(message) {
  let fallback = document.getElementById("error-screen");

  if (!fallback) {
    fallback = document.createElement("div");
    fallback.id = "error-screen";

    fallback.style.position = "fixed";
    fallback.style.top = "0";
    fallback.style.left = "0";
    fallback.style.width = "100%";
    fallback.style.height = "100%";
    fallback.style.background = "#202225";
    fallback.style.color = "white";
    fallback.style.display = "flex";
    fallback.style.flexDirection = "column";
    fallback.style.justifyContent = "center";
    fallback.style.alignItems = "center";
    fallback.style.zIndex = "9999";
    fallback.style.fontFamily = "Arial";

    document.body.appendChild(fallback);
  }

  fallback.innerHTML = `
    <h2>⚠️ System Error</h2>
    <p>${message}</p>
    <button onclick="location.reload()" 
      style="padding:10px;background:#5865f2;color:white;border:none;border-radius:5px;cursor:pointer;">
      Reload
    </button>
  `;
}


// ======================
// 🧠 SAFE WRAPPER (opcional mas MUITO útil)
// ======================
export function safe(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error("Safe error caught:", err);
      showFallbackUI("Operation failed safely.");
    }
  };
}
