// ===============================
// 🔇 MUTE SYSTEM - FIREBASE MODULE
// db/mute.db.js
// ===============================

// This module handles:
// - Mute / Unmute users
// - Feed mute filtering
// - Chat mute filtering
// - Real-time mute listeners
// - Cache optimization
// - Safe Firestore operations

import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================
// 🔥 INIT
// ===============================
const db = getFirestore();

// ===============================
// 📌 COLLECTION STRUCTURE
// ===============================
// mutes/{muterId_mutedId}
// muted/{userId}/list/{mutedUserId}
// mutedBy/{userId}/list/{muterUserId}

// ===============================
// 🧠 CACHE SYSTEM
// ===============================
const muteCache = {
  status: new Map(),
  muted: new Map(),
  mutedBy: new Map()
};

// ===============================
// 🧩 UTILITIES
// ===============================
function muteKey(a, b) {
  return `${a}_${b}`;
}

function isValidId(id) {
  return typeof id === "string" && id.length > 0;
}

function now() {
  return serverTimestamp();
}

// ===============================
// 🔇 MUTE USER
// ===============================
export async function muteUser(muterId, mutedId, reason = "") {
  if (!isValidId(muterId) || !isValidId(mutedId)) {
    throw new Error("Invalid user IDs");
  }

  if (muterId === mutedId) {
    throw new Error("Cannot mute yourself");
  }

  const key = muteKey(muterId, mutedId);

  try {
    const batch = writeBatch(db);

    const muteRef = doc(db, "mutes", key);
    const mutedRef = doc(db, "muted", muterId, "list", mutedId);
    const mutedByRef = doc(db, "mutedBy", mutedId, "list", muterId);

    batch.set(muteRef, {
      muterId,
      mutedId,
      reason,
      createdAt: now()
    });

    batch.set(mutedRef, {
      userId: mutedId,
      reason,
      createdAt: now()
    });

    batch.set(mutedByRef, {
      userId: muterId,
      createdAt: now()
    });

    await batch.commit();

    muteCache.status.set(key, true);

    return {
      success: true,
      message: "User muted successfully"
    };

  } catch (err) {
    console.error("muteUser error:", err);
    throw err;
  }
}

// ===============================
// 🔊 UNMUTE USER
// ===============================
export async function unmuteUser(muterId, mutedId) {
  if (!isValidId(muterId) || !isValidId(mutedId)) {
    throw new Error("Invalid user IDs");
  }

  const key = muteKey(muterId, mutedId);

  try {
    const batch = writeBatch(db);

    const muteRef = doc(db, "mutes", key);
    const mutedRef = doc(db, "muted", muterId, "list", mutedId);
    const mutedByRef = doc(db, "mutedBy", mutedId, "list", muterId);

    batch.delete(muteRef);
    batch.delete(mutedRef);
    batch.delete(mutedByRef);

    await batch.commit();

    muteCache.status.set(key, false);

    return {
      success: true,
      message: "User unmuted successfully"
    };

  } catch (err) {
    console.error("unmuteUser error:", err);
    throw err;
  }
}

// ===============================
// 🔍 CHECK MUTE STATUS
// ===============================
export async function isMuted(muterId, mutedId) {
  const key = muteKey(muterId, mutedId);

  if (muteCache.status.has(key)) {
    return muteCache.status.get(key);
  }

  try {
    const muteRef = doc(db, "mutes", key);
    const snap = await getDoc(muteRef);

    const exists = snap.exists();

    muteCache.status.set(key, exists);

    return exists;

  } catch (err) {
    console.error("isMuted error:", err);
    return false;
  }
}

// ===============================
// 📥 GET MUTED USERS
// ===============================
export async function getMutedUsers(userId) {
  if (!isValidId(userId)) return [];

  try {
    const mutedCol = collection(db, "muted", userId, "list");
    const snap = await getDocs(mutedCol);

    const result = [];

    snap.forEach(doc => {
      result.push(doc.id);
    });

    muteCache.muted.set(userId, result);

    return result;

  } catch (err) {
    console.error("getMutedUsers error:", err);
    return [];
  }
}

// ===============================
// 📥 GET MUTED BY USERS
// ===============================
export async function getMutedByUsers(userId) {
  if (!isValidId(userId)) return [];

  try {
    const mutedByCol = collection(db, "mutedBy", userId, "list");
    const snap = await getDocs(mutedByCol);

    const result = [];

    snap.forEach(doc => {
      result.push(doc.id);
    });

    muteCache.mutedBy.set(userId, result);

    return result;

  } catch (err) {
    console.error("getMutedByUsers error:", err);
    return [];
  }
}

// ===============================
// 🔄 REAL-TIME MUTED LISTENER
// ===============================
export function listenMutedUsers(userId, callback) {
  if (!isValidId(userId)) return () => {};

  const mutedCol = collection(db, "muted", userId, "list");

  return onSnapshot(mutedCol, (snap) => {
    const muted = [];

    snap.forEach(doc => {
      muted.push(doc.id);
    });

    muteCache.muted.set(userId, muted);

    callback(muted);
  });
}

// ===============================
// 🔄 REAL-TIME MUTED BY LISTENER
// ===============================
export function listenMutedByUsers(userId, callback) {
  if (!isValidId(userId)) return () => {};

  const mutedByCol = collection(db, "mutedBy", userId, "list");

  return onSnapshot(mutedByCol, (snap) => {
    const mutedBy = [];

    snap.forEach(doc => {
      mutedBy.push(doc.id);
    });

    muteCache.mutedBy.set(userId, mutedBy);

    callback(mutedBy);
  });
}

// ===============================
// 📰 FILTER FEED POSTS
// ===============================
export async function filterMutedPosts(viewerId, posts = []) {
  if (!isValidId(viewerId)) return posts;

  try {
    const mutedUsers = await getMutedUsers(viewerId);

    if (!mutedUsers.length) {
      return posts;
    }

    return posts.filter(post => {
      return !mutedUsers.includes(post.userId);
    });

  } catch (err) {
    console.error("filterMutedPosts error:", err);
    return posts;
  }
}

// ===============================
// 💬 FILTER CHAT MESSAGES
// ===============================
export async function filterMutedMessages(viewerId, messages = []) {
  if (!isValidId(viewerId)) return messages;

  try {
    const mutedUsers = await getMutedUsers(viewerId);

    if (!mutedUsers.length) {
      return messages;
    }

    return messages.filter(message => {
      return !mutedUsers.includes(message.userId);
    });

  } catch (err) {
    console.error("filterMutedMessages error:", err);
    return messages;
  }
}

// ===============================
// ⚡ QUICK MUTE TOGGLE
// ===============================
export async function toggleMute(muterId, mutedId) {
  try {
    const muted = await isMuted(muterId, mutedId);

    if (muted) {
      return await unmuteUser(muterId, mutedId);
    }

    return await muteUser(muterId, mutedId);

  } catch (err) {
    console.error("toggleMute error:", err);
    throw err;
  }
}

// ===============================
// 🧹 CACHE CLEANUP
// ===============================
export function clearMuteCache() {
  muteCache.status.clear();
  muteCache.muted.clear();
  muteCache.mutedBy.clear();
}

// ===============================
// 📊 DEBUG CACHE
// ===============================
export function debugMuteCache() {
  return {
    status: Array.from(muteCache.status.entries()),
    muted: Array.from(muteCache.muted.entries()),
    mutedBy: Array.from(muteCache.mutedBy.entries())
  };
}

// ===============================
// 🧠 READY CHECK
// ===============================
export function muteSystemReady() {
  return typeof db !== "undefined";
}

// ===============================
// END MODULE
// ===============================
