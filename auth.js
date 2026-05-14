// ======================
// 🔐 SIMPLE AUTH (IMPROVED VERSION)
// ======================

let currentUser = null;

const USERS = {
  "lucas": "1234"
};


// ======================
// 🔁 INIT USER (AUTO LOAD)
// ======================
function initUser() {
  const saved = localStorage.getItem("user");

  if (saved) {
    try {
      currentUser = JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao carregar usuário:", e);
      localStorage.removeItem("user");
    }
  }
}


// inicializa automaticamente ao importar o módulo
initUser();


// ======================
// LOGIN
// ======================
export function login(username, password) {
  if (!username || !password) {
    alert("Preencha usuário e senha");
    return null;
  }

  const validUser = USERS[username];

  if (validUser && validUser === password) {
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
// GET USER
// ======================
export function getUser() {
  return currentUser;
}


// ======================
// CHECK LOGIN STATUS
// ======================
export function isLogged() {
  return currentUser !== null;
}
