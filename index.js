// ======================
// 🌐 CONFIG
// ======================
const WELCOME_MESSAGE = "Welcome to the academic and university forum";


// ======================
// 🧯 FALLBACK ERROR
// ======================
function showFallback(message) {
  let el = document.getElementById("fallback");

  if (!el) {
    el = document.createElement("div");
    el.id = "fallback";

    el.style.cssText = `
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
      z-index:99999;
      font-family:Arial;
    `;

    document.body.appendChild(el);
  }

  el.innerHTML = `
    <h2>⚠️ System Error</h2>
    <p>${message}</p>
    <button onclick="location.reload()"
      style="padding:10px;background:#5865f2;color:white;border:none;border-radius:6px;">
      Reload
    </button>
  `;
}


// ======================
// 👤 USER STATE
// ======================
let currentUser = null;


// ======================
// 🔐 LOGIN (AGORA COMPATÍVEL COM index.html)
// ======================
function login(username, password) {
  const USERS = {
    "lucas": "1234"
  };

  if (USERS[username] && USERS[username] === password) {

    currentUser = {
      uid: username,
      displayName: username
    };

    localStorage.setItem("user", JSON.stringify(currentUser));

    // 🔥 MOSTRAR APP (SEM reload)
    const loginBox = document.getElementById("loginBox");
    const app = document.getElementById("appContainer");

    if (loginBox) loginBox.style.display = "none";
    if (app) app.style.display = "flex";

    return currentUser;
  }

  showFallback("Invalid login");
  return null;
}


// ======================
// 🔄 RESTORE SESSION
// ======================
function restoreUser() {
  const saved = localStorage.getItem("user");

  if (saved) {
    currentUser = JSON.parse(saved);

    const loginBox = document.getElementById("loginBox");
    const app = document.getElementById("appContainer");

    if (loginBox) loginBox.style.display = "none";
    if (app) app.style.display = "flex";
  }
}


// ======================
// 📝 CREATE POST (SAFE MODE SEM FIREBASE ERRO)
// ======================
async function createPost() {
  try {
    const input = document.getElementById("postInput");
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    if (!currentUser) {
      showFallback("You must login first");
      return;
    }

    // 🔥 TEMPORÁRIO (SEM FIREBASE PRA NÃO QUEBRAR AGORA)
    const container = document.getElementById("posts");

    const div = document.createElement("div");
    div.innerHTML = `
      <p><b>${currentUser.displayName}</b></p>
      <p>${text}</p>
      <hr/>
    `;

    container.prepend(div);

    input.value = "";

  } catch (err) {
    console.error(err);
    showFallback("Failed to send message");
  }
}


// ======================
// 📡 CHAT INIT
// ======================
function initChat() {
  const container = document.getElementById("posts");
  if (!container) return;

  container.innerHTML = `
    <div><b>${WELCOME_MESSAGE}</b></div>
  `;
}


// ======================
// 🚀 INIT
// ======================
window.addEventListener("DOMContentLoaded", () => {
  restoreUser();
  initChat();
});


// ======================
// 🌍 EXPORT GLOBAL
// ======================
window.login = login;
window.createPost = createPost;
