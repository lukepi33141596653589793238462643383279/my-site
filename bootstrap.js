// ======================
// 🧠 BOOTSTRAP - SIMPLIFIED CORE
// ======================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
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
// 🚀 INIT SAFE
// ======================
let app = null;
let db = null;


// ======================
// 🧯 FALLBACK (ANTI CRASH)
// ======================
function crashSafe(message) {
  let fallback = document.getElementById("bootstrap-fallback");

  if (!fallback) {
    fallback = document.createElement("div");
    fallback.id = "bootstrap-fallback";

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
      z-index:99999;
      font-family:Arial;
    `;

    document.body.appendChild(fallback);
  }

  fallback.innerHTML = `
    <h2>⚠️ Bootstrap Error</h2>
    <p>${message}</p>
    <button onclick="location.reload()"
      style="padding:10px;background:#5865f2;color:white;border:none;border-radius:6px;">
      Reload App
    </button>
  `;
}


// ======================
// 🚀 INIT FUNCTION
// ======================
function initFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);

    console.log("✅ Firebase initialized (Firestore only)");

    return { app, db };

  } catch (err) {
    console.error("Bootstrap error:", err);
    crashSafe("Firebase initialization failed.");
    return null;
  }
}


// ======================
// 🚀 EXPORT CLEAN
// ======================
const firebase = initFirebase();

export const appInstance = firebase?.app;
export const dbInstance = firebase?.db;


// ======================
// 🧠 STATUS CHECK
// ======================
export function isFirebaseReady() {
  return !!dbInstance;
}
