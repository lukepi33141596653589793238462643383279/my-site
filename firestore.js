
// ======================
// 🧠 FIRESTORE MODULE (BOOTSTRAP BASED)
// ======================

import {
  dbInstance
} from "./bootstrap.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================
// 🧯 FALLBACK (ANTI TELA BRANCA)
// ======================
function firestoreFallback(message) {
  let el = document.getElementById("firestore-fallback");

  if (!el) {
    el = document.createElement("div");
    el.id = "firestore-fallback";

    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.background = "#202225";
    el.style.color = "white";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.justifyContent = "center";
    el.style.alignItems = "center";
    el.style.zIndex = "99999";
    el.style.fontFamily = "Arial";

    document.body.appendChild(el);
  }

  el.innerHTML = `
    <h2>⚠️ Database Error</h2>
    <p>${message}</p>
    <button onclick="location.reload()"
      style="padding:10px;background:#5865f2;color:white;border:none;border-radius:6px;cursor:pointer;">
      Reload
    </button>
  `;
}


// ======================
// 💬 CREATE POST / MESSAGE
// ======================
export async function createPost(text, user) {
  try {
    if (!dbInstance) {
      firestoreFallback("Database not initialized");
      return;
    }

    if (!text || !user) return;

    await addDoc(collection(dbInstance, "posts"), {
      text,
      user: user.displayName || "Unknown",
      photo: user.photoURL || null,
      uid: user.uid,
      createdAt: serverTimestamp()
    });

  } catch (err) {
    console.error("Create post error:", err);
    firestoreFallback("Failed to send message");
  }
}


// ======================
// 📡 LISTEN POSTS (REALTIME)
// ======================
export function listenPosts(callback) {
  try {
    if (!dbInstance) {
      firestoreFallback("Database not ready");
      return;
    }

    const q = query(
      collection(dbInstance, "posts"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      callback(posts);
    });

  } catch (err) {
    console.error("Listen posts error:", err);
    firestoreFallback("Realtime listener crashed");
  }
}


// ======================
// 🧠 SAFE READ (FUTURO EXPANSÃO)
// ======================
export async function getPostsOnce() {
  try {
    if (!dbInstance) {
      firestoreFallback("Database not ready");
      return [];
    }

    const q = query(
      collection(dbInstance, "posts"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await new Promise((resolve, reject) => {
      onSnapshot(q, resolve, reject);
    });

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (err) {
    console.error("Get posts error:", err);
    firestoreFallback("Failed to load posts");
    return [];
  }
}
