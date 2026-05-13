
// ======================
// 🧠 BOOTSTRAP - APP INIT CORE
// ======================

// 🔥 Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================
// 🔧 FIREBASE CONFIG
// ======================
const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};


// ======================
// 🚀 INIT SAFETY WRAPPER
// ======================
let app = null;
let auth = null;
let db = null;
let provider = null;


// ======================
// 🧯 FALLBACK SYSTEM (ANTI CRASH GLOBAL)
// ======================
function crashSafe(message) {
  let fallback = document.getElementById("bootstrap-fallback");

  if (!fallback) {
    fallback = document.createElement("div");
    fallback.id = "bootstrap-fallback";

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
    fallback.style.zIndex = "99999";
    fallback.style.fontFamily = "Arial";

    document.body.appendChild(fallback);
  }

  fallback.innerHTML = `
    <h2>⚠️ Bootstrap Error</h2>
    <p>${message}</p>
    <button onclick="location.reload()"
      style="padding:10px;background:#5865f2;color:white;border:none;border-radius:6px;cursor:pointer;">
      Reload App
    </button>
  `;
}


// ======================
// 🔧 BOOTSTRAP INIT FUNCTION
// ======================
function initFirebase() {
  try {
    app = initializeApp(firebaseConfig);

    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();

    console.log("✅ Firebase initialized successfully");

    return {
      app,
      auth,
      db,
      provider
    };

  } catch (err) {
    console.error("Bootstrap Firebase error:", err);
    crashSafe("Firebase failed to initialize.");
    return null;
  }
}


// ======================
// 🚀 EXPORT SINGLE INIT POINT
// ======================
const firebase = initFirebase();

export const appInstance = firebase?.app;
export const authInstance = firebase?.auth;
export const dbInstance = firebase?.db;
export const providerInstance = firebase?.provider;


// ======================
// 🧠 STATUS CHECK (OPTIONAL DEBUG)
// ======================
export function isFirebaseReady() {
  return !!(appInstance && authInstance && dbInstance);
}
