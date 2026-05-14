// =========================
// 🔥 FIREBASE CORE (FIRESTORE ONLY) - FIXED
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =========================
// 🔧 CONFIG FIREBASE
// =========================
const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY_REAL_AQUI",
  authDomain: "COLE_SEU_PROJETO.firebaseapp.com",
  projectId: "COLE_SEU_PROJECT_ID",
  storageBucket: "COLE_SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "COLE_SEU_SENDER_ID",
  appId: "COLE_SEU_APP_ID"
};


// =========================
// 🚀 INIT
// =========================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// =========================
// 💬 CREATE POST (FIXED + SAFE)
// =========================
const createPost = async (text, user, room = "global") => {
  try {
    if (!text || !user) return;

    await addDoc(collection(db, "rooms", room, "messages"), {
      text: text,
      user: user.displayName || "anonymous",
      uid: user.uid || null,
      room: room,

      // 🔥 fallback timestamp (evita bugs de orden)
      createdAt: serverTimestamp(),
      localTime: Date.now()
    });

  } catch (error) {
    console.error("❌ Erro ao enviar mensagem:", error);
  }
};


// =========================
// 📡 LISTEN POSTS (100% SAFE)
// =========================
const listenPosts = (callback, room = "global") => {
  try {
    const q = query(
      collection(db, "rooms", room, "messages"),
      orderBy("localTime", "desc") // 🔥 mais estável que serverTimestamp
    );

    return onSnapshot(q, (snapshot) => {

      // 🔍 DEBUG IMPORTANTE
      if (snapshot.empty) {
        console.log("⚠️ Nenhuma mensagem encontrada no Firestore");
      }

      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      callback(messages);
    });

  } catch (error) {
    console.error("❌ Erro ao escutar mensagens:", error);
  }
};


// =========================
// 🧠 HELPERS
// =========================
const setRoom = (room) => room || "global";


// =========================
// 🌐 EXPORTS
// =========================
export {
  db,
  createPost,
  listenPosts,
  setRoom
};
