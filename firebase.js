// 🔥 Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// 🔐 AUTH
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🧠 FIRESTORE
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =========================
// 🔧 CONFIGURAÇÃO FIREBASE
// =========================
const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};


// =========================
// 🚀 INIT
// =========================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();


// =========================
// 🔐 AUTH HELPERS (EVITA ERRO NO APP)
// =========================
const loginWithGoogle = () => signInWithPopup(auth, provider);
const logoutUser = () => signOut(auth);
const onUserChange = (callback) => onAuthStateChanged(auth, callback);


// =========================
// 💬 FIRESTORE HELPERS
// =========================

// Enviar mensagem segura
const sendMessage = async (text, user) => {
  if (!user || !text) return;

  return await addDoc(collection(db, "messages"), {
    text,
    uid: user.uid,
    name: user.displayName,
    photo: user.photoURL || null,
    createdAt: serverTimestamp()
  });
};

// Escutar mensagens em tempo real
const listenMessages = (callback) => {
  const q = query(collection(db, "messages"), orderBy("createdAt"));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    callback(messages);
  });
};


// =========================
// 🌐 EXPORT ÚNICO (MAIS LIMPO)
// =========================
export {
  // core
  auth,
  db,
  provider,

  // auth
  loginWithGoogle,
  logoutUser,
  onUserChange,

  // firestore raw (caso precise)
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  where,

  // helpers prontos (IMPORTANTE PRO SEU CHAT)
  sendMessage,
  listenMessages
};
