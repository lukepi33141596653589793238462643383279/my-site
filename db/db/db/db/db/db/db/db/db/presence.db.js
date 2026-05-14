# db/messages.db.js

```javascript
// =====================================================
// 💬 messages.db.js
// Real-Time Messaging System
// Firebase Firestore Architecture
// =====================================================

// =====================================================
// 🔥 FIREBASE IMPORTS
// =====================================================

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  increment,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =====================================================
// 🧠 DATABASE
// =====================================================

const db = getFirestore();

// =====================================================
// 📁 COLLECTIONS
// =====================================================

const MESSAGES_COLLECTION = "messages";
const ROOMS_COLLECTION = "rooms";
const DM_COLLECTION = "directMessages";
const MESSAGE_REPORTS = "messageReports";
const MESSAGE_REACTIONS = "messageReactions";
const MESSAGE_PINNED = "messagePinned";
const MESSAGE_READS = "messageReads";
const MESSAGE_TYPING = "typingStatus";

// =====================================================
// 🏗️ MESSAGE TEMPLATE
// =====================================================

export function createMessageTemplate() {
  return {
    id: "",
    roomId: "",
    userId: "",
    username: "",
    avatar: "",
    content: "",
    image: "",
    file: "",
    fileName: "",
    replyTo: null,
    edited: false,
    deleted: false,
    system: false,
    reactions: {},
    mentions: [],
    readBy: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

// =====================================================
// 🚀 SEND MESSAGE
// =====================================================

export async function sendMessage({
  roomId,
  userId,
  username,
  avatar,
  content,
  image = "",
  file = "",
  fileName = "",
  replyTo = null
}) {

  try {

    if (!roomId) {
      throw new Error("roomId is required");
    }

    if (!userId) {
      throw new Error("userId is required");
    }

    if (!content && !image && !file) {
      throw new Error("message cannot be empty");
    }

    const messageData = {
      roomId,
      userId,
      username,
      avatar,
      content,
      image,
      file,
      fileName,
      replyTo,
      edited: false,
      deleted: false,
      system: false,
      reactions: {},
      mentions: extractMentions(content),
      readBy: [userId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const messageRef = await addDoc(
      collection(db, MESSAGES_COLLECTION),
      messageData
    );

    await updateRoomLastMessage(roomId, {
      content,
      username,
      createdAt: new Date()
    });

    return {
      success: true,
      messageId: messageRef.id
    };

  } catch (error) {

    console.error("SEND MESSAGE ERROR:", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// 📥 GET ROOM MESSAGES
// =====================================================

export async function getRoomMessages(roomId, max = 100) {

  try {

    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where("roomId", "==", roomId),
      orderBy("createdAt", "asc"),
      limit(max)
    );

    const snapshot = await getDocs(q);

    const messages = [];

    snapshot.forEach((docItem) => {
      messages.push({
        id: docItem.id,
        ...docItem.data()
      });
    });

    return messages;

  } catch (error) {

    console.error("GET ROOM MESSAGES ERROR:", error);

    return [];
  }
}

// =====================================================
// 🔴 REALTIME ROOM LISTENER
// =====================================================

export function listenRoomMessages(roomId, callback) {

  try {

    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where("roomId", "==", roomId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const messages = [];

      snapshot.forEach((docItem) => {
        messages.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      callback(messages);

    });

    return unsubscribe;

  } catch (error) {

    console.error("LISTENER ERROR:", error);

    return null;
  }
}

// =====================================================
// ✏️ EDIT MESSAGE
// =====================================================

export async function editMessage(messageId, newContent) {

  try {

    if (!messageId) {
      throw new Error("messageId required");
    }

    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);

    await updateDoc(messageRef, {
      content: newContent,
      edited: true,
      updatedAt: serverTimestamp()
    });

    return {
      success: true
    };

  } catch (error) {

    console.error("EDIT MESSAGE ERROR:", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// 🗑️ DELETE MESSAGE
// =====================================================

export async function deleteMessage(messageId) {

  try {

    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);

    await updateDoc(messageRef, {
      deleted: true,
      content: "This message was deleted",
      updatedAt: serverTimestamp()
    });

    return {
      success: true
    };

  } catch (error) {

    console.error("DELETE MESSAGE ERROR:", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// ❤️ REACT TO MESSAGE
// =====================================================

export async function reactToMessage({
  messageId,
  userId,
  emoji
}) {

  try {

    const reactionId = `${messageId}_${userId}_${emoji}`;

    const reactionRef = doc(db, MESSAGE_REACTIONS, reactionId);

    await setDoc(reactionRef, {
      messageId,
      userId,
      emoji,
      createdAt: serverTimestamp()
    });

    return {
      success: true
    };

  } catch (error) {

    console.error("REACTION ERROR:", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// 📌 PIN MESSAGE
// =====================================================

export async function pinMessage({
  messageId,
  roomId,
  pinnedBy
}) {

  try {

    const pinRef = doc(db, MESSAGE_PINNED, messageId);

    await setDoc(pinRef, {
      messageId,
      roomId,
      pinnedBy,
      createdAt: serverTimestamp()
    });

    return {
      success: true
    };

  } catch (error) {

    console.error("PIN MESSAGE ERROR:", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// 👁️ MARK MESSAGE AS READ
// =====================================================

export async function markMessageAsRead({
  messageId,
  userId
}) {

  try {

    const readId = `${messageId}_${userId}`;

    const readRef = doc(db, MESSAGE_READS, readId);

    await setDoc(readRef, {
      messageId,
      userId,
      readAt: serverTimestamp()
    });

    return {
      success: true
    };

  } catch (error) {

    console.error("READ ERROR:", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// ⌨️ TYPING STATUS
// =====================================================

export async function setTypingStatus({
  roomId,
  userId,
  username,
  typing
}) {

  try {

    const typingId = `${roomId}_${userId}`;

    const typingRef = doc(db, MESSAGE_TYPING, typingId);

    await setDoc(typingRef, {
      roomId,
      userId,
      username,
      typing,
      updatedAt: serverTimestamp()
    });

    return true;

  } catch (error) {

    console.error("TYPING STATUS ERROR:", error);

    return false;
  }
}

// =====================================================
// 👂 LISTEN TYPING STATUS
// =====================================================

export function listenTypingStatus(roomId, callback) {

  try {

    const q = query(
      collection(db, MESSAGE_TYPING),
      where("roomId", "==", roomId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const typingUsers = [];

      snapshot.forEach((docItem) => {

        const data = docItem.data();

        if (data.typing) {
          typingUsers.push(data);
        }
      });

      callback(typingUsers);

    });

    return unsubscribe;

  } catch (error) {

    console.error("LISTEN TYPING ERROR:", error);

    return null;
  }
}

// =====================================================
// 🚨 REPORT MESSAGE
// =====================================================

export async function reportMessage({
  messageId,
  reporterId,
  reason
}) {

  try {

    await addDoc(collection(db, MESSAGE_REPORTS), {
      messageId,
      reporterId,
      reason,
      createdAt: serverTimestamp()
    });

    return {
      success: true
    };

  } catch (error) {

    console.error("REPORT ERROR:", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// 📬 DIRECT MESSAGE
// =====================================================

export async function sendDirectMessage({
  conversationId,
  senderId,
  receiverId,
  content
}) {

  try {

    const messageRef = await addDoc(
      collection(db, DM_COLLECTION),
      {
        conversationId,
        senderId,
        receiverId,
        content,
        seen: false,
        createdAt: serverTimestamp()
      }
    );

    return {
      success: true,
      messageId: messageRef.id
    };

  } catch (error) {

    console.error("DIRECT MESSAGE ERROR:", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// 📡 LISTEN DIRECT MESSAGES
// =====================================================

export function listenDirectMessages(conversationId, callback) {

  try {

    const q = query(
      collection(db, DM_COLLECTION),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const messages = [];

      snapshot.forEach((docItem) => {
        messages.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      callback(messages);

    });

    return unsubscribe;

  } catch (error) {

    console.error("DM LISTENER ERROR:", error);

    return null;
  }
}

// =====================================================
// 🔍 SEARCH MESSAGES
// =====================================================

export async function searchMessages(roomId, keyword) {

  try {

    const messages = await getRoomMessages(roomId, 500);

    const results = messages.filter((message) => {

      if (!message.content) {
        return false;
      }

      return message.content
        .toLowerCase()
        .includes(keyword.toLowerCase());
    });

    return results;

  } catch (error) {

    console.error("SEARCH ERROR:", error);

    return [];
  }
}

// =====================================================
// 🧹 CLEAN OLD TYPING STATUS
// =====================================================

export async function cleanupTypingStatus(roomId) {

  try {

    const q = query(
      collection(db, MESSAGE_TYPING),
      where("roomId", "==", roomId)
    );

    const snapshot = await getDocs(q);

    const batch = writeBatch(db);

    snapshot.forEach((docItem) => {
      batch.delete(docItem.ref);
    });

    await batch.commit();

    return true;

  } catch (error) {

    console.error("CLEANUP ERROR:", error);

    return false;
  }
}

// =====================================================
// 🧠 EXTRACT MENTIONS
// =====================================================

export function extractMentions(content = "") {

  try {

    const regex = /@([a-zA-Z0-9_]+)/g;

    const mentions = [];

    let match;

    while ((match = regex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;

  } catch (error) {

    console.error("MENTIONS ERROR:", error);

    return [];
  }
}

// =====================================================
// 🏠 UPDATE ROOM LAST MESSAGE
// =====================================================

export async function updateRoomLastMessage(roomId, lastMessage) {

  try {

    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    await updateDoc(roomRef, {
      lastMessage,
      updatedAt: serverTimestamp(),
      messageCount: increment(1)
    });

    return true;

  } catch (error) {

    console.error("UPDATE ROOM ERROR:", error);

    return false;
  }
}

// =====================================================
// 📊 GET ROOM MESSAGE COUNT
// =====================================================

export async function getRoomMessageCount(roomId) {

  try {

    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where("roomId", "==", roomId)
    );

    const snapshot = await getDocs(q);

    return snapshot.size;

  } catch (error) {

    console.error("COUNT ERROR:", error);

    return 0;
  }
}

// =====================================================
// 🔥 SYSTEM MESSAGE
// =====================================================

export async function sendSystemMessage({
  roomId,
  content
}) {

  try {

    await addDoc(collection(db, MESSAGES_COLLECTION), {
      roomId,
      userId: "system",
      username: "SYSTEM",
      avatar: "",
      content,
      system: true,
      deleted: false,
      edited: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return true;

  } catch (error) {

    console.error("SYSTEM MESSAGE ERROR:", error);

    return false;
  }
}

// =====================================================
// 📤 EXPORT DEFAULT
// =====================================================

export default {
  createMessageTemplate,
  sendMessage,
  getRoomMessages,
  listenRoomMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  pinMessage,
  markMessageAsRead,
  setTypingStatus,
  listenTypingStatus,
  reportMessage,
  sendDirectMessage,
  listenDirectMessages,
  searchMessages,
  cleanupTypingStatus,
  extractMentions,
  updateRoomLastMessage,
  getRoomMessageCount,
  sendSystemMessage
};

```
