// ======================
// 🌐 CONFIG
// ======================
const WELCOME_MESSAGE = "Welcome to the academic and university forum";


// ======================
// 🧯 SAFE FALLBACK (ANTI TELA BRANCA)
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
// 🧯 GLOBAL ERRORS
// ======================
window.addEventListener("error", (e) => {
  console.error(e.error);
  showFallback("Unexpected error occurred");
});

window.addEventListener("unhandledrejection", (e) => {
  console.error(e.reason);
  showFallback("Async error occurred");
});


// ======================
// 👤 USER STATE (LOGIN SIMPLES)
// ======================
let currentUser = null;


// ======================
// 🔐 LOGIN (USERNAME + PASSWORD)
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

    const loginBox = document.getElementById("loginBox");
    if (loginBox) loginBox.style.display = "none";

    console.log("Logged:", currentUser.displayName);

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
  }
}


// ======================
// 📝 CREATE POST (FIRESTORE)
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

    await addDoc(collection(db, "posts"), {
      text,
      user: currentUser.displayName || "Unknown",
      uid: currentUser.uid,
      createdAt: serverTimestamp()
    });

    input.value = "";

  } catch (err) {
    console.error(err);
    showFallback("Failed to send message");
  }
}


// ======================
// 📡 REALTIME POSTS
// ======================
function initChat() {
  try {
    const container = document.getElementById("posts");
    if (!container) {
      showFallback("UI not found");
      return;
    }

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
      container.innerHTML = "";

      const welcome = document.createElement("div");
      welcome.innerHTML = `<b>${WELCOME_MESSAGE}</b>`;
      container.appendChild(welcome);

      snapshot.forEach((docSnap) => {
        const post = docSnap.data();

        const div = document.createElement("div");
        div.innerHTML = `
          <p><b>${post.user || "Unknown"}</b></p>
          <p>${post.text || ""}</p>
        `;

        container.appendChild(div);
      });
    });

  } catch (err) {
    console.error(err);
    showFallback("Chat failed to load");
  }
}


// ======================
// 🚀 INIT APP
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
