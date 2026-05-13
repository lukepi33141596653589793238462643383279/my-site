// ======================
// 🔐 AUTH MODULE (CLEAN VERSION)
// ======================

import {
  auth,
  provider,
  loginWithGoogle,
  logoutUser,
  onUserChange
} from "./firebase.js";


// ======================
// 🧠 STATE
// ======================
let currentUser = null;


// ======================
// 🔐 LOGIN GOOGLE
// ======================
export async function loginGoogle() {
  try {
    const user = await loginWithGoogle();
    currentUser = user?.user || null;

    console.log("✅ Login success:", currentUser?.displayName);

    return currentUser;

  } catch (err) {
    console.error("❌ Login error (REAL):", err);
    alert("Login failed: " + err.message);
    return null;
  }
}


// ======================
// 🚪 LOGOUT
// ======================
export async function logout() {
  try {
    await logoutUser();
    currentUser = null;

    console.log("🚪 Logged out");

  } catch (err) {
    console.error("❌ Logout error:", err);
    alert("Logout failed: " + err.message);
  }
}


// ======================
// 👤 AUTH STATE
// ======================
export function initAuth(callback) {
  onUserChange((user) => {
    currentUser = user;
    callback(user);
  });
}


// ======================
// 🧠 GET USER
// ======================
export function getCurrentUser() {
  return currentUser;
}
