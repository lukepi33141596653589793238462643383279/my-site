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
// 🧠 POSTS DATABASE LAYER
// ======================

// 📌 coleção principal de posts
const postsCollection = collection(db, "posts");


// ======================
// 📤 CRIAR POST
// ======================
export async function createPost({
  text,
  userId,
  username,
  mediaURL = null,
  type = "text" // text | image | video
}) {

  if (!userId || (!text && !mediaURL)) return;

  try {
    await addDoc(postsCollection, {
      text: text?.trim() || "",
      userId,
      username,
      mediaURL,
      type,
      createdAt: serverTimestamp()
    });

  } catch (error) {
    console.error("Erro ao criar post:", error);
  }
}


// ======================
// 👀 FEED EM TEMPO REAL
// ======================
export function listenPosts(callback) {

  const q = query(
    postsCollection,
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    callback(posts);
  });
}


// ======================
// 🧹 (FUTURO) DELETE POST
// ======================
// export async function deletePost(id) {
//   ...
// }
