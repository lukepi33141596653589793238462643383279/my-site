// =========================
// 🔥 FIREBASE CORE (SÓ FIRESTORE)
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
// 🔧 FIREBASE CONFIG
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
// 💬 SEND POST (USA USER LOCAL)
// =========================
const createPost = async (text, user) => {
  if (!user || !text) return;

  return await addDoc(collection(db, "posts"), {
    text,
    user: user.displayName,
    uid: user.uid,
    createdAt: serverTimestamp()
  });
};


// =========================
// 📡 LISTEN POSTS
// =========================
const listenPosts = (callback) => {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
  });
};


// =========================
// 🌐 EXPORT (LIMPO)
// =========================
export {
  db,
  createPost,
  listenPosts
};
