// ===============================
// 🤝 FRIEND SYSTEM - FIREBASE MODULE
// db/friend.db.js
// ===============================

// This module handles:
// - Friend requests
// - Accept / Reject requests
// - Remove friends
// - Real-time listeners
// - Friend lists
// - Online social architecture
// - Cache optimization

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================
// 🔥 INIT
// ===============================
const db = getFirestore();

// ===============================
// 📌 COLLECTION STRUCTURE
// ===============================

// friendRequests/{sender_receiver}
// friends/{userId}/list/{friendId}
// friendRequestsInbox/{userId}/list/{senderId}
// friendRequestsSent/{userId}/list/{receiverId}

// ===============================
// 🧠 CACHE
// ===============================
const friendCache = {
  requests: new Map(),
  friends: new Map(),
  status: new Map()
};

// ===============================
// 🧩 UTILITIES
// ===============================
function requestKey(a, b) {
  return `${a}_${b}`;
}

function isValidId(id) {
  return typeof id === "string" && id.length > 0;
}

function now() {
  return serverTimestamp();
}

// ===============================
// 📤 SEND FRIEND REQUEST
// ===============================
export async function sendFriendRequest(senderId, receiverId) {

  if (!isValidId(senderId) || !isValidId(receiverId)) {
    throw new Error("Invalid user IDs");
  }

  if (senderId === receiverId) {
    throw new Error("Cannot add yourself");
  }

  const key = requestKey(senderId, receiverId);

  try {

    const batch = writeBatch(db);

    const requestRef = doc(db, "friendRequests", key);

    const inboxRef = doc(
      db,
      "friendRequestsInbox",
      receiverId,
      "list",
      senderId
    );

    const sentRef = doc(
      db,
      "friendRequestsSent",
      senderId,
      "list",
      receiverId
    );

    batch.set(requestRef, {
      senderId,
      receiverId,
      createdAt: now(),
      status: "pending"
    });

    batch.set(inboxRef, {
      senderId,
      createdAt: now()
    });

    batch.set(sentRef, {
      receiverId,
      createdAt: now()
    });

    await batch.commit();

    return {
      success: true,
      message: "Friend request sent"
    };

  } catch (err) {
    console.error("sendFriendRequest error:", err);
    throw err;
  }
}

// ===============================
// ✅ ACCEPT FRIEND REQUEST
// ===============================
export async function acceptFriendRequest(senderId, receiverId) {

  const key = requestKey(senderId, receiverId);

  try {

    const batch = writeBatch(db);

    // remove request
    const requestRef = doc(db, "friendRequests", key);

    const inboxRef = doc(
      db,
      "friendRequestsInbox",
      receiverId,
      "list",
      senderId
    );

    const sentRef = doc(
      db,
      "friendRequestsSent",
      senderId,
      "list",
      receiverId
    );

    batch.delete(requestRef);
    batch.delete(inboxRef);
    batch.delete(sentRef);

    // create friendship
    const friendARef = doc(
      db,
      "friends",
      senderId,
      "list",
      receiverId
    );

    const friendBRef = doc(
      db,
      "friends",
      receiverId,
      "list",
      senderId
    );

    batch.set(friendARef, {
      userId: receiverId,
      createdAt: now()
    });

    batch.set(friendBRef, {
      userId: senderId,
      createdAt: now()
    });

    await batch.commit();

    return {
      success: true,
      message: "Friend request accepted"
    };

  } catch (err) {
    console.error("acceptFriendRequest error:", err);
    throw err;
  }
}

// ===============================
// ❌ REJECT FRIEND REQUEST
// ===============================
export async function rejectFriendRequest(senderId, receiverId) {

  const key = requestKey(senderId, receiverId);

  try {

    const batch = writeBatch(db);

    const requestRef = doc(db, "friendRequests", key);

    const inboxRef = doc(
      db,
      "friendRequestsInbox",
      receiverId,
      "list",
      senderId
    );

    const sentRef = doc(
      db,
      "friendRequestsSent",
      senderId,
      "list",
      receiverId
    );

    batch.delete(requestRef);
    batch.delete(inboxRef);
    batch.delete(sentRef);

    await batch.commit();

    return {
      success: true,
      message: "Friend request rejected"
    };

  } catch (err) {
    console.error("rejectFriendRequest error:", err);
    throw err;
  }
}

// ===============================
// 🗑 REMOVE FRIEND
// ===============================
export async function removeFriend(userA, userB) {

  try {

    const batch = writeBatch(db);

    const friendARef = doc(
      db,
      "friends",
      userA,
      "list",
      userB
    );

    const friendBRef = doc(
      db,
      "friends",
      userB,
      "list",
      userA
    );

    batch.delete(friendARef);
    batch.delete(friendBRef);

    await batch.commit();

    return {
      success: true,
      message: "Friend removed"
    };

  } catch (err) {
    console.error("removeFriend error:", err);
    throw err;
  }
}

// ===============================
// 👥 GET FRIENDS
// ===============================
export async function getFriends(userId) {

  if (!isValidId(userId)) return [];

  try {

    const friendsCol = collection(
      db,
      "friends",
      userId,
      "list"
    );

    const snap = await getDocs(friendsCol);

    const result = [];

    snap.forEach(doc => {
      result.push(doc.id);
    });

    friendCache.friends.set(userId, result);

    return result;

  } catch (err) {
    console.error("getFriends error:", err);
    return [];
  }
}

// ===============================
// 🔍 CHECK FRIENDSHIP
// ===============================
export async function areFriends(userA, userB) {

  const key = requestKey(userA, userB);

  if (friendCache.status.has(key)) {
    return friendCache.status.get(key);
  }

  try {

    const friendRef = doc(
      db,
      "friends",
      userA,
      "list",
      userB
    );

    const snap = await getDoc(friendRef);

    const exists = snap.exists();

    friendCache.status.set(key, exists);

    return exists;

  } catch (err) {
    console.error("areFriends error:", err);
    return false;
  }
}

// ===============================
// 📥 GET INCOMING REQUESTS
// ===============================
export async function getIncomingRequests(userId) {

  try {

    const inboxCol = collection(
      db,
      "friendRequestsInbox",
      userId,
      "list"
    );

    const snap = await getDocs(inboxCol);

    const result = [];

    snap.forEach(doc => {
      result.push(doc.id);
    });

    return result;

  } catch (err) {
    console.error("getIncomingRequests error:", err);
    return [];
  }
}

// ===============================
// 📤 GET SENT REQUESTS
// ===============================
export async function getSentRequests(userId) {

  try {

    const sentCol = collection(
      db,
      "friendRequestsSent",
      userId,
      "list"
    );

    const snap = await getDocs(sentCol);

    const result = [];

    snap.forEach(doc => {
      result.push(doc.id);
    });

    return result;

  } catch (err) {
    console.error("getSentRequests error:", err);
    return [];
  }
}

// ===============================
// 🔄 REALTIME FRIENDS LISTENER
// ===============================
export function listenFriends(userId, callback) {

  if (!isValidId(userId)) {
    return () => {};
  }

  const friendsCol = collection(
    db,
    "friends",
    userId,
    "list"
  );

  return onSnapshot(friendsCol, (snap) => {

    const friends = [];

    snap.forEach(doc => {
      friends.push(doc.id);
    });

    friendCache.friends.set(userId, friends);

    callback(friends);

  });
}

// ===============================
// 🔄 REALTIME REQUESTS LISTENER
// ===============================
export function listenFriendRequests(userId, callback) {

  if (!isValidId(userId)) {
    return () => {};
  }

  const inboxCol = collection(
    db,
    "friendRequestsInbox",
    userId,
    "list"
  );

  return onSnapshot(inboxCol, (snap) => {

    const requests = [];

    snap.forEach(doc => {
      requests.push(doc.id);
    });

    callback(requests);

  });
}

// ===============================
// ⚡ QUICK ADD OR REMOVE
// ===============================
export async function toggleFriend(userA, userB) {

  try {

    const friends = await areFriends(userA, userB);

    if (friends) {
      return await removeFriend(userA, userB);
    }

    return await sendFriendRequest(userA, userB);

  } catch (err) {
    console.error("toggleFriend error:", err);
    throw err;
  }
}

// ===============================
// 🧹 CACHE CLEANUP
// ===============================
export function clearFriendCache() {

  friendCache.requests.clear();
  friendCache.friends.clear();
  friendCache.status.clear();

}

// ===============================
// 📊 DEBUG CACHE
// ===============================
export function debugFriendCache() {

  return {
    requests: Array.from(friendCache.requests.entries()),
    friends: Array.from(friendCache.friends.entries()),
    status: Array.from(friendCache.status.entries())
  };

}

// ===============================
// 🧠 SYSTEM READY CHECK
// ===============================
export function friendSystemReady() {
  return typeof db !== "undefined";
}

// ===============================
// END MODULE
// ===============================
