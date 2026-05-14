// ===============================
// 🔔 NOTIFICATION SYSTEM - FIREBASE MODULE
// db/notification.db.js
// ===============================

// This module handles:
// - Real-time notifications
// - Friend notifications
// - Follow notifications
// - Like notifications
// - Comment notifications
// - Read / unread state
// - Notification counters
// - Notification deletion
// - Cache optimization

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================
// 🔥 INIT
// ===============================
const db = getFirestore();

// ===============================
// 📌 COLLECTION STRUCTURE
// ===============================

// notifications/{notificationId}
// users/{userId}/notifications/{notificationId}

// notification object:
// {
//   type: "follow",
//   senderId: "...",
//   receiverId: "...",
//   postId: "...",
//   message: "...",
//   read: false,
//   createdAt: timestamp
// }

// ===============================
// 🧠 CACHE SYSTEM
// ===============================
const notificationCache = {
  notifications: new Map(),
  unreadCounts: new Map()
};

// ===============================
// 🧩 UTILITIES
// ===============================
function isValidId(id) {
  return typeof id === "string" && id.length > 0;
}

function now() {
  return serverTimestamp();
}

function generateNotificationId() {
  return crypto.randomUUID();
}

// ===============================
// 🔔 CREATE NOTIFICATION
// ===============================
export async function createNotification({
  type = "system",
  senderId = "",
  receiverId = "",
  postId = "",
  message = ""
}) {

  if (!isValidId(receiverId)) {
    throw new Error("Invalid receiverId");
  }

  try {

    const notificationId = generateNotificationId();

    const notificationRef = doc(
      db,
      "users",
      receiverId,
      "notifications",
      notificationId
    );

    await setDoc(notificationRef, {
      id: notificationId,
      type,
      senderId,
      receiverId,
      postId,
      message,
      read: false,
      createdAt: now()
    });

    // increment unread count
    const userRef = doc(db, "users", receiverId);

    await updateDoc(userRef, {
      unreadNotifications: increment(1)
    });

    return {
      success: true,
      notificationId
    };

  } catch (err) {
    console.error("createNotification error:", err);
    throw err;
  }
}

// ===============================
// ❤️ LIKE NOTIFICATION
// ===============================
export async function sendLikeNotification({
  senderId,
  receiverId,
  postId
}) {

  if (senderId === receiverId) return;

  return await createNotification({
    type: "like",
    senderId,
    receiverId,
    postId,
    message: "liked your post"
  });
}

// ===============================
// 💬 COMMENT NOTIFICATION
// ===============================
export async function sendCommentNotification({
  senderId,
  receiverId,
  postId
}) {

  if (senderId === receiverId) return;

  return await createNotification({
    type: "comment",
    senderId,
    receiverId,
    postId,
    message: "commented on your post"
  });
}

// ===============================
// 👥 FOLLOW NOTIFICATION
// ===============================
export async function sendFollowNotification({
  senderId,
  receiverId
}) {

  if (senderId === receiverId) return;

  return await createNotification({
    type: "follow",
    senderId,
    receiverId,
    message: "started following you"
  });
}

// ===============================
// 🤝 FRIEND REQUEST NOTIFICATION
// ===============================
export async function sendFriendRequestNotification({
  senderId,
  receiverId
}) {

  if (senderId === receiverId) return;

  return await createNotification({
    type: "friend_request",
    senderId,
    receiverId,
    message: "sent you a friend request"
  });
}

// ===============================
// 📥 GET NOTIFICATIONS
// ===============================
export async function getNotifications(userId) {

  if (!isValidId(userId)) return [];

  try {

    const notificationsCol = collection(
      db,
      "users",
      userId,
      "notifications"
    );

    const q = query(
      notificationsCol,
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const snap = await getDocs(q);

    const result = [];

    snap.forEach(doc => {
      result.push({
        id: doc.id,
        ...doc.data()
      });
    });

    notificationCache.notifications.set(userId, result);

    return result;

  } catch (err) {
    console.error("getNotifications error:", err);
    return [];
  }
}

// ===============================
// 📬 GET UNREAD COUNT
// ===============================
export async function getUnreadCount(userId) {

  if (!isValidId(userId)) return 0;

  try {

    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) return 0;

    const count = snap.data().unreadNotifications || 0;

    notificationCache.unreadCounts.set(userId, count);

    return count;

  } catch (err) {
    console.error("getUnreadCount error:", err);
    return 0;
  }
}

// ===============================
// ✅ MARK AS READ
// ===============================
export async function markNotificationAsRead(
  userId,
  notificationId
) {

  try {

    const notificationRef = doc(
      db,
      "users",
      userId,
      "notifications",
      notificationId
    );

    await updateDoc(notificationRef, {
      read: true
    });

    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      unreadNotifications: increment(-1)
    });

    return {
      success: true
    };

  } catch (err) {
    console.error("markNotificationAsRead error:", err);
    throw err;
  }
}

// ===============================
// ✅ MARK ALL AS READ
// ===============================
export async function markAllNotificationsAsRead(userId) {

  try {

    const notifications = await getNotifications(userId);

    for (const notification of notifications) {

      if (!notification.read) {

        const notificationRef = doc(
          db,
          "users",
          userId,
          "notifications",
          notification.id
        );

        await updateDoc(notificationRef, {
          read: true
        });
      }
    }

    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      unreadNotifications: 0
    });

    return {
      success: true
    };

  } catch (err) {
    console.error("markAllNotificationsAsRead error:", err);
    throw err;
  }
}

// ===============================
// 🗑 DELETE NOTIFICATION
// ===============================
export async function deleteNotification(
  userId,
  notificationId
) {

  try {

    const notificationRef = doc(
      db,
      "users",
      userId,
      "notifications",
      notificationId
    );

    const snap = await getDoc(notificationRef);

    if (snap.exists()) {

      const data = snap.data();

      if (!data.read) {

        const userRef = doc(db, "users", userId);

        await updateDoc(userRef, {
          unreadNotifications: increment(-1)
        });
      }
    }

    await deleteDoc(notificationRef);

    return {
      success: true
    };

  } catch (err) {
    console.error("deleteNotification error:", err);
    throw err;
  }
}

// ===============================
// 🔄 REALTIME NOTIFICATIONS
// ===============================
export function listenNotifications(userId, callback) {

  if (!isValidId(userId)) {
    return () => {};
  }

  const notificationsCol = collection(
    db,
    "users",
    userId,
    "notifications"
  );

  const q = query(
    notificationsCol,
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(q, (snap) => {

    const notifications = [];

    snap.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    notificationCache.notifications.set(
      userId,
      notifications
    );

    callback(notifications);

  });
}

// ===============================
// 🔄 REALTIME UNREAD COUNT
// ===============================
export function listenUnreadCount(userId, callback) {

  if (!isValidId(userId)) {
    return () => {};
  }

  const userRef = doc(db, "users", userId);

  return onSnapshot(userRef, (snap) => {

    if (!snap.exists()) {
      callback(0);
      return;
    }

    const count =
      snap.data().unreadNotifications || 0;

    notificationCache.unreadCounts.set(
      userId,
      count
    );

    callback(count);

  });
}

// ===============================
// 🧹 CLEAR CACHE
// ===============================
export function clearNotificationCache() {

  notificationCache.notifications.clear();
  notificationCache.unreadCounts.clear();

}

// ===============================
// 📊 DEBUG CACHE
// ===============================
export function debugNotificationCache() {

  return {
    notifications: Array.from(
      notificationCache.notifications.entries()
    ),
    unreadCounts: Array.from(
      notificationCache.unreadCounts.entries()
    )
  };

}

// ===============================
// 🧠 READY CHECK
// ===============================
export function notificationSystemReady() {
  return typeof db !== "undefined";
}

// ===============================
// END MODULE
// ===============================
