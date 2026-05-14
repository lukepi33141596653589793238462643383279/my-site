import { createPost, listenPosts } from "./firebase.js";
import { login, logout, getUser, isLogged } from "./auth.js";


// ======================
// 📦 STATE
// ======================
let currentRoom = "global";


// ======================
// 💬 SEND MESSAGE (AUTH CHECK)
// ======================
export function sendMessage(text) {
  const user = getUser();

  if (!isLogged() || !user) {
    alert("Você precisa estar logado para enviar mensagens");
    return;
  }

  if (!text) return;

  createPost(text, user, currentRoom);
}


// ======================
// 📡 START CHAT LISTENER
// ======================
export function startChat(renderCallback) {
  listenPosts((messages) => {
    renderCallback(messages);
  }, currentRoom);
}


// ======================
// 🔁 SET ROOM (CANAIS)
// ======================
export function setRoom(room) {
  currentRoom = room || "global";
}


// ======================
// 🔐 LOGIN WRAPPER (UI FRIENDLY)
// ======================
export function handleLogin(username, password) {
  const user = login(username, password);

  if (user) {
    console.log("Logado como:", user.displayName);
    return user;
  }
}


// ======================
// 🚪 LOGOUT WRAPPER
// ======================
export function handleLogout() {
  logout();
}
