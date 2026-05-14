// ===============================
// 👥 FOLLOW SYSTEM - FIREBASE MODULE
// db/follow.db.js
// ===============================

// This module handles:
// - Follow / Unfollow users
// - Followers / Following lists
// - Real-time listeners
// - Follow counters
// - Cache helpers
// - Safe Firestore operations

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================
// 🔥 INIT
// ===============================
const db = getFirestore();

// ===============================
// 📌 COLLECTION STRUCTURE
// ===============================
// users/{userId}
// follows/{followerId_followingId}
// followers/{userId}/list/{followerId}
// following/{userId}/list/{followingId}

// ===============================
// 🧠 INTERNAL CACHE (lightweight)
// ===============================
const followCache = {
  followers: new Map(),
  following: new Map(),
  status: new Map() // key: followerId_followingId => boolean
};

// ===============================
// 🧩 UTIL
// ===============================
function followKey(a, b) {
  return `${a}_${b}`;
}

function isValidId(id) {
  return typeof id === "string" && id.length > 0;
}

function now() {
  return serverTimestamp();
}

// ===============================
// 👤 CORE: FOLLOW USER
// ===============================
export async function followUser(followerId, followingId) {
  if (!isValidId(followerId) || !isValidId(followingId)) {
    throw new Error("Invalid user IDs");
  }

  if (followerId === followingId) {
    throw new Error("Cannot follow yourself");
  }

  const key = followKey(followerId, followingId);

  try {
    const batch = writeBatch(db);

    const followRef = doc(db, "follows", key);
    const followerRef = doc(db, "followers", followingId, "list", followerId);
    const followingRef = doc(db, "following", followerId, "list", followingId);

    batch.set(followRef, {
      followerId,
      followingId,
      createdAt: now()
    });

    batch.set(followerRef, {
      userId: followerId,
      createdAt: now()
    });

    batch.set(followingRef, {
      userId: followingId,
      createdAt: now()
    });

    const followerCountRef = doc(db, "users", followingId);
    const followingCountRef = doc(db, "users", followerId);

    batch.update(followerCountRef, {
      followersCount: increment(1)
    });

    batch.update(followingCountRef, {
      followingCount: increment(1)
    });

    await batch.commit();

    followCache.status.set(key, true);

    return {
      success: true,
      message: "Followed successfully"
    };
  } catch (err) {
    console.error("followUser error:", err);
    throw err;
  }
}

// ===============================
// 🚫 CORE: UNFOLLOW USER
// ===============================
export async function unfollowUser(followerId, followingId) {
  if (!isValidId(followerId) || !isValidId(followingId)) {
    throw new Error("Invalid user IDs");
  }

  if (followerId === followingId) {
    throw new Error("Cannot unfollow yourself");
  }

  const key = followKey(followerId, followingId);

  try {
    const batch = writeBatch(db);

    const followRef = doc(db, "follows", key);
    const followerRef = doc(db, "followers", followingId, "list", followerId);
    const followingRef = doc(db, "following", followerId, "list", followingId);

    batch.delete(followRef);
    batch.delete(followerRef);
    batch.delete(followingRef);

    const followerCountRef = doc(db, "users", followingId);
    const followingCountRef = doc(db, "users", followerId);

    batch.update(followerCountRef, {
      followersCount: increment(-1)
    });

    batch.update(followingCountRef, {
      followingCount: increment(-1)
    });

    await batch.commit();

    followCache.status.set(key, false);

    return {
      success: true,
      message: "Unfollowed successfully"
    };
  } catch (err) {
    console.error("unfollowUser error:", err);
    throw err;
  }
}

// ===============================
// 🔍 CHECK FOLLOW STATUS
// ===============================
export async function isFollowing(followerId, followingId) {
  const key = followKey(followerId, followingId);

  if (followCache.status.has(key)) {
    return followCache.status.get(key);
  }

  try {
    const ref = doc(db, "follows", key);
    const snap = await getDoc(ref);

    const exists = snap.exists();
    followCache.status.set(key, exists);

    return exists;
  } catch (err) {
    console.error("isFollowing error:", err);
    return false;
  }
}

// ===============================
// 👥 GET FOLLOWERS LIST
// ===============================
export async function getFollowers(userId) {
  if (!isValidId(userId)) return [];

  try {
    const q = collection(db, "followers", userId, "list");
    const snap = await getDocs(q);

    const result = [];
    snap.forEach(doc => {
      result.push(doc.id);
    });

    followCache.followers.set(userId, result);

    return result;
  } catch (err) {
    console.error("getFollowers error:", err);
    return [];
  }
}

// ===============================
// 👤 GET FOLLOWING LIST
// ===============================
export async function getFollowing(userId) {
  if (!isValidId(userId)) return [];

  try {
    const q = collection(db, "following", userId, "list");
    const snap = await getDocs(q);

    const result = [];
    snap.forEach(doc => {
      result.push(doc.id);
    });

    followCache.following.set(userId, result);

    return result;
  } catch (err) {
    console.error("getFollowing error:", err);
    return [];
  }
}

// ===============================
// 🔄 REAL-TIME FOLLOWERS LISTENER
// ===============================
export function listenFollowers(userId, callback) {
  if (!isValidId(userId)) return () => {};

  const q = collection(db, "followers", userId, "list");

  return onSnapshot(q, (snap) => {
    const followers = [];
    snap.forEach(doc => followers.push(doc.id));

    followCache.followers.set(userId, followers);

    callback(followers);
  });
}

// ===============================
// 🔄 REAL-TIME FOLLOWING LISTENER
// ===============================
export function listenFollowing(userId, callback) {
  if (!isValidId(userId)) return () => {};

  const q = collection(db, "following", userId, "list");

  return onSnapshot(q, (snap) => {
    const following = [];
    snap.forEach(doc => following.push(doc.id));

    followCache.following.set(userId, following);

    callback(following);
  });
}

// ===============================
// 📊 GET FOLLOW STATS
// ===============================
export async function getFollowStats(userId) {
  if (!isValidId(userId)) {
    return { followers: 0, following: 0 };
  }

  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      return { followers: 0, following: 0 };
    }

    const data = snap.data();

    return {
      followers: data.followersCount || 0,
      following: data.followingCount || 0
    };
  } catch (err) {
    console.error("getFollowStats error:", err);
    return { followers: 0, following: 0 };
  }
}

// ===============================
// ⚡ BATCH FOLLOW (for future features)
// ===============================
export async function followMultiple(followerId, userIds = []) {
  if (!isValidId(followerId) || !Array.isArray(userIds)) return;

  const batch = writeBatch(db);

  userIds.forEach(followingId => {
    if (!isValidId(followingId) || followerId === followingId) return;

    const key = followKey(followerId, followingId);

    const followRef = doc(db, "follows", key);
    const followerRef = doc(db, "followers", followingId, "list", followerId);
    const followingRef = doc(db, "following", followerId, "list", followingId);

    batch.set(followRef, {
      followerId,
      followingId,
      createdAt: now()
    });

    batch.set(followerRef, { userId: followerId, createdAt: now() });
    batch.set(followingRef, { userId: followingId, createdAt: now() });
  });

  await batch.commit();

  return { success: true };
}

// ===============================
// 🧹 CACHE CLEAR
// ===============================
export function clearFollowCache() {
  followCache.followers.clear();
  followCache.following.clear();
  followCache.status.clear();
}

// ===============================
// 📌 DEBUG HELPERS
// ===============================
export function debugFollowCache() {
  return {
    followers: Array.from(followCache.followers.entries()),
    following: Array.from(followCache.following.entries()),
    status: Array.from(followCache.status.entries())
  };
}

// ===============================
// 🧠 READY CHECK
// ===============================
export function followSystemReady() {
  return typeof db !== "undefined";
}

// ===============================
// END OF MODULE
// ===============================
