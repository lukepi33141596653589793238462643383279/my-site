
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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
// 🔧 FIREBASE INIT
// ======================
let app, auth, db, provider;

try {
  const firebaseConfig = {
    apiKey: "COLE_AQUI",
    authDomain: "COLE_AQUI",
    projectId: "COLE_AQUI",
    storageBucket: "COLE_AQUI",
    messagingSenderId: "COLE_AQUI",
    appId: "COLE_AQUI"
  };

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  provider = new GoogleAuthProvider();

} catch (err) {
  console.error(err);
  showFallback("Firebase failed to initialize");
}


// ======================
// 👤 USER STATE
// ======================
let currentUser = null;


// ======================
// 🔐 LOGIN GOOGLE
// ======================
async function loginGoogle() {
  try {
    if (!auth || !provider) {
      showFallback("Auth not ready");
      return;
    }

    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;

    const loginBox = document.getElementById("loginBox");
    if (loginBox) loginBox.style.display = "none";

    console.log("Logged:", currentUser.displayName);

  } catch (err) {
    console.error(err);
    showFallback("Login failed");
  }
}


// ======================
// 📝 CREATE POST
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

    if (!db) {
      showFallback("Database not ready");
      return;
    }

    await addDoc(collection(db, "posts"), {
      text,
      user: currentUser.displayName || "Unknown",
      photo: currentUser.photoURL || null,
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
// 🚀 INIT APP SAFELY
// ======================
window.addEventListener("DOMContentLoaded", () => {
  if (db) initChat();
});


// ======================
// 🌍 EXPORT FUNCTIONS
// ======================
window.loginGoogle = loginGoogle;
window.createPost = createPost;
