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
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =========================
// 🔧 CONFIGURAÇÃO FIREBASE (OBRIGATÓRIO)
// =========================
const firebaseConfig = {
  apiKey: "SEU_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
};


// =========================
// 🚀 INIT (EVITA DUPLICAÇÃO)
// =========================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();


// =========================
// 🔐 AUTH SAFE (COM ERRO REAL)
// =========================
const loginWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    alert("Login failed: " + error.message);
  }
};

const logoutUser = () => signOut(auth);

const onUserChange = (callback) => onAuthStateChanged(auth, callback);


// =========================
// 💬 FIRESTORE HELPERS
// =========================
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

const listenMessages = (callback) => {
  const q = query(collection(db, "messages"), orderBy("createdAt"));

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
  });
};


// =========================
// 🌐 EXPORT
// =========================
export {
  auth,
  db,
  provider,

  loginWithGoogle,
  logoutUser,
  onUserChange,

  sendMessage,
  listenMessages
};
