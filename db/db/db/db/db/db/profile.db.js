import { db } from "../firebase.js";

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================
// 👤 PROFILE DATABASE LAYER
// ======================

// 📌 coleção de perfis
const profilesCollection = collection(db, "profiles");


// ======================
// 🆕 CRIAR PERFIL (SIGNUP HOOK)
// ======================
export async function createProfile(userId, data) {

  if (!userId) return;

  const ref = doc(profilesCollection, userId);

  try {
    await setDoc(ref, {
      userId,
      username: data.username || "user",
      bio: data.bio || "",
      photoURL: data.photoURL || "",
      bannerURL: data.bannerURL || "",
      createdAt: serverTimestamp(),
      followersCount: 0,
      followingCount: 0
    });

  } catch (error) {
    console.error("Erro ao criar perfil:", error);
  }
}


// ======================
// 👀 PEGAR PERFIL
// ======================
export async function getProfile(userId) {

  if (!userId) return null;

  const ref = doc(profilesCollection, userId);

  try {
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }

    return null;

  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }
}


// ======================
// ✏️ ATUALIZAR PERFIL
// ======================
export async function updateProfile(userId, updates) {

  if (!userId) return;

  const ref = doc(profilesCollection, userId);

  try {
    await updateDoc(ref, updates);

  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
  }
}


// ======================
// 👀 LISTENER DE PERFIL (REAL TIME)
// ======================
export function listenProfile(userId, callback) {

  const ref = doc(profilesCollection, userId);

  return onSnapshot(ref, (docSnap) => {

    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    }
  });
}
