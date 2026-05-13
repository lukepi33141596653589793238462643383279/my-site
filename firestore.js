// ======================
// 💬 FIRESTORE MODULE (CLEAN VERSION)
// ======================

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";


// ======================
// 🧯 FALLBACK (ANTI CRASH)
// ======================
function firestoreFallback(message) {
  let el = document.getElementById("firestore-fallback");

  if (!el) {
    el = document.createElement("div");
    el.id = "firestore-fallback";

    el.style.cssText = `
      position:fixed;
      top:0;
      left:0;
      width:100%;
      height:100%;
      background:#202225;
      color:white;
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      z-index:99999;
      font-family:Arial;
    `;

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
// 💬 CREATE POST
// ======================
export async function createPost(text, user) {
  try {
    if (!db) {
      firestoreFallback("Database not initialized");
      return;
    }

    if (!text || !user) return;

    await addDoc(collection(db, "posts"), {
      text,
      user: user.displayName,
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
    if (!db) {
      firestoreFallback("Database not ready");
      return;
    }

    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      callback(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    });

  } catch (err) {
    console.error("Listen posts error:", err);
    firestoreFallback("Realtime listener crashed");
  }
}


// ======================
// 🧠 GET POSTS ONCE (OPTIONAL)
// ======================
export async function getPostsOnce() {
  try {
    if (!db) {
      firestoreFallback("Database not ready");
      return [];
    }

    return await new Promise((resolve, reject) => {
      const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc")
      );

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          unsub();
          resolve(snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        },
        reject
      );
    });

  } catch (err) {
    console.error("Get posts error:", err);
    firestoreFallback("Failed to load posts");
    return [];
  }
}
