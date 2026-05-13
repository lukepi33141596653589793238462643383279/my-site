
// ======================
// 🔐 AUTH MODULE (BOOTSTRAP BASED)
// ======================

import {
  authInstance,
  providerInstance
} from "./bootstrap.js";

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ======================
// 🧠 STATE SAFE
// ======================
let currentUser = null;


// ======================
// 🧯 SAFE FALLBACK (NUNCA TELA BRANCA)
// ======================
function authFallback(message) {
  let el = document.getElementById("auth-fallback");

  if (!el) {
    el = document.createElement("div");
    el.id = "auth-fallback";

    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.background = "#202225";
    el.style.color = "white";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.justifyContent = "center";
    el.style.alignItems = "center";
    el.style.zIndex = "99999";
    el.style.fontFamily = "Arial";

    document.body.appendChild(el);
  }

  el.innerHTML = `
    <h2>⚠️ Auth Error</h2>
    <p>${message}</p>
    <button onclick="location.reload()"
      style="padding:10px;background:#5865f2;color:white;border:none;border-radius:6px;cursor:pointer;">
      Reload
    </button>
  `;
}


// ======================
// 🔐 LOGIN GOOGLE
// ======================
export async function loginGoogle() {
  try {
    if (!authInstance || !providerInstance) {
      authFallback("Auth system not ready");
      return null;
    }

    const result = await signInWithPopup(authInstance, providerInstance);
    currentUser = result.user;

    console.log("✅ User logged in:", currentUser.displayName);

    return currentUser;

  } catch (err) {
    console.error("Login error:", err);
    authFallback("Google login failed");
    return null;
  }
}


// ======================
// 🚪 LOGOUT
// ======================
export async function logoutUser() {
  try {
    if (!authInstance) {
      authFallback("Auth not initialized");
      return;
    }

    await signOut(authInstance);
    currentUser = null;

    console.log("🚪 User logged out");

  } catch (err) {
    console.error("Logout error:", err);
    authFallback("Logout failed");
  }
}


// ======================
// 👤 AUTH STATE LISTENER
// ======================
export function onUserChange(callback) {
  try {
    if (!authInstance) {
      authFallback("Auth listener failed");
      return;
    }

    onAuthStateChanged(authInstance, (user) => {
      currentUser = user;
      callback(user);
    });

  } catch (err) {
    console.error("Auth state error:", err);
    authFallback("Auth state listener crashed");
  }
}


// ======================
// 🧠 GET CURRENT USER SAFE
// ======================
export function getCurrentUser() {
  return currentUser;
}
