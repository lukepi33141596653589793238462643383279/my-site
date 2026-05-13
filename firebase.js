// 🔥 Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// 🔐 AUTH (Google Login)
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🧠 FIRESTORE (Banco de dados)
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

// 🔧 CONFIGURAÇÃO FIREBASE (COLE AQUI DO CONSOLE)
const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

// 🚀 INIT APP
const app = initializeApp(firebaseConfig);

// 🔐 AUTH INSTANCE
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 🧠 DATABASE INSTANCE
const db = getFirestore(app);

// 🌐 EXPORTS (USO GLOBAL NO SITE)
export {
  auth,
  db,
  provider,
  signInWithPopup,
  signOut,

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
};
