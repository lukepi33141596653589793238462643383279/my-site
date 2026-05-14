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
// 🎬 MEDIA DATABASE LAYER
// ======================

// 📌 coleção de mídia (imagens + vídeos curtos)
const mediaCollection = collection(db, "media");


// ======================
// 📤 UPLOAD DE MÍDIA
// ======================
export async function uploadMedia({
  userId,
  username,
  mediaURL,
  type // "image" | "video"
}) {

  if (!userId || !mediaURL || !type) return;

  try {
    await addDoc(mediaCollection, {
      userId,
      username,
      mediaURL,
      type,
      duration: type === "video" ? 8 : null, // limite conceitual
      createdAt: serverTimestamp()
    });

  } catch (error) {
    console.error("Erro ao enviar mídia:", error);
  }
}


// ======================
// 👀 FEED DE MÍDIA EM TEMPO REAL
// ======================
export function listenMedia(callback) {

  const q = query(
    mediaCollection,
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {

    const media = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    callback(media);
  });
}


// ======================
// 🧹 (FUTURO) DELETE MEDIA
// ======================
// export async function deleteMedia(id) {
//   ...
// }
