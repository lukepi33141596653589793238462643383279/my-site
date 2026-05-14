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
// 📚 FILES DATABASE LAYER
// ======================

// 📌 coleção de arquivos (PDFs, ebooks, etc.)
const filesCollection = collection(db, "files");


// ======================
// 📤 UPLOAD DE ARQUIVO
// ======================
export async function uploadFile({
  userId,
  username,
  fileURL,
  fileName,
  fileType = "pdf" // pdf | ebook | doc | etc
}) {

  if (!userId || !fileURL || !fileName) return;

  try {
    await addDoc(filesCollection, {
      userId,
      username,
      fileURL,
      fileName,
      fileType,
      createdAt: serverTimestamp()
    });

  } catch (error) {
    console.error("Erro ao enviar arquivo:", error);
  }
}


// ======================
// 👀 LISTAR ARQUIVOS EM TEMPO REAL
// ======================
export function listenFiles(callback) {

  const q = query(
    filesCollection,
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {

    const files = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    callback(files);
  });
}


// ======================
// 🧹 (FUTURO) DELETE FILE
// ======================
// export async function deleteFile(id) {
//   ...
// }
