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
// 🔧 FIREBASE CONFIG (OBRIGATÓRIO)
// =========================
// ⚠️ AQUI NÃO PODE SER "SEU_API_KEY"
// TEM QUE SER O VALOR REAL DO FIREBASE CONSOLE
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
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();


// =========================
// 🔐 LOGIN (COM ERRO REAL)
// =========================
const loginWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("🔥 LOGIN ERROR REAL:", error.code, error.message);

    // Mostra erro real (isso é importante pra debug)
    alert(`Login failed: ${error.message}`);

    throw error; // mantém erro visível
  }
};

const logoutUser = () => signOut(auth);

const onUserChange = (callback) => onAuthStateChanged(auth, callback);


// =========================
// 💬 FIRESTORE
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
    callback(snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
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
