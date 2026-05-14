// ======================
// 💬 FIRESTORE MODULE (STABLE VERSION)
// ======================

import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================
// 💬 CREATE POST (FIXED PATH + SAFE ORDER)
// ======================
export async function createPost(text, user) {
  try {
    if (!db) throw new Error("DB not initialized");
    if (!text || !user) return;

    await addDoc(collection(db, "rooms", "global", "messages"), {
      text,
      user: user.displayName || "anonymous",
      uid: user.uid || null,

      createdAt: serverTimestamp(),
      localTime: Date.now()
    });

  } catch (err) {
    console.error("Create post error:", err);
    firestoreFallback("Failed to send message");
  }
}


// ======================
// 📡 LISTEN POSTS (FIXED REALTIME)
// ======================
export function listenPosts(callback) {
  try {
    if (!db) throw new Error("DB not ready");

    const q = query(
      collection(db, "rooms", "global", "messages"),
      orderBy("localTime", "desc")
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
    console.error("Listen error:", err);
    firestoreFallback("Realtime listener crashed");
  }
}
