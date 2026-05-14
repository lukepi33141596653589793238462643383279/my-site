import { db } from "../firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================
// 🧠 FORUMS DATABASE LAYER
// ======================

// 📌 coleção de threads (tópicos principais)
const threadsCollection = collection(db, "threads");

// 📌 coleção de comentários dentro das threads
const commentsCollection = collection(db, "comments");


// ======================
// 🧵 CRIAR THREAD (TÓPICO)
// ======================
export async function createThread({
  title,
  content,
  userId,
  username,
  channel = "general"
}) {

  if (!title || !userId) return;

  try {
    await addDoc(threadsCollection, {
      title: title.trim(),
      content: content?.trim() || "",
      userId,
      username,
      channel,
      createdAt: serverTimestamp()
    });

  } catch (error) {
    console.error("Erro ao criar thread:", error);
  }
}


// ======================
// 👀 LISTAR THREADS (EM TEMPO REAL)
// ======================
export function listenThreads(callback, channel = "general") {

  const q = query(
    threadsCollection,
    where("channel", "==", channel),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {

    const threads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    callback(threads);
  });
}


// ======================
// 💬 COMENTAR EM THREAD
// ======================
export async function addComment({
  threadId,
  userId,
  username,
  text
}) {

  if (!threadId || !userId || !text) return;

  try {
    await addDoc(commentsCollection, {
      threadId,
      userId,
      username,
      text: text.trim(),
      createdAt: serverTimestamp()
    });

  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
  }
}


// ======================
// 👀 LISTAR COMENTÁRIOS (THREAD ESPECÍFICA)
// ======================
export function listenComments(threadId, callback) {

  const q = query(
    commentsCollection,
    where("threadId", "==", threadId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {

    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    callback(comments);
  });
}
