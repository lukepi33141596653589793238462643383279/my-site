// ======================
// 🔐 SIMPLE LOGIN (FAST MODE)
// ======================

let currentUser = null;

// usuário fake simples (você pode mudar depois)
const USERS = {
  "lucas": "1234"
};

// ======================
// LOGIN
// ======================
export function login(username, password) {
  if (USERS[username] && USERS[username] === password) {
    currentUser = {
      uid: username,
      displayName: username
    };

    localStorage.setItem("user", JSON.stringify(currentUser));

    return currentUser;
  }

  alert("Login inválido");
  return null;
}

// ======================
// LOGOUT
// ======================
export function logout() {
  currentUser = null;
  localStorage.removeItem("user");
}

// ======================
// CHECK LOGIN
// ======================
export function getUser() {
  if (currentUser) return currentUser;

  const saved = localStorage.getItem("user");
  if (saved) {
    currentUser = JSON.parse(saved);
  }

  return currentUser;
}
