import { db } from "../firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================
// 💬 CHAT DATABASE LAYER
// ======================

// 📌 referência da coleção "chats"
const chatCollection = collection(db, "chats");


// ======================
// 📤 ENVIAR MENSAGEM
// ======================
export async function sendMessage({ text, userId, username, channelId }) {
  if (!text || !userId) return;

  try {
    await addDoc(chatCollection, {
      text: text.trim(),
      userId,
      username,
      channelId: channelId || "general",
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
  }
}


// ======================
// 👀 LISTENER (TEMPO REAL)
// ======================
export function listenMessages(callback, channelId = "general") {

  const q = query(
    chatCollection,
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {

    const messages = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(msg => msg.channelId === channelId);

    callback(messages);
  });
}


// ======================
// 🧹 (FUTURO) DELETE MESSAGE
// ======================
// export async function deleteMessage(id) {
//   ...
// }
