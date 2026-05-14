# db/servers.db.js

```javascript
// =====================================================
// 🏠 servers.db.js
// Discord Style Server System
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
  arrayUnion,
  arrayRemove,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =====================================================
// 🧠 DATABASE
// =====================================================

const db = getFirestore();

// =====================================================
// 📁 COLLECTIONS
// =====================================================

const SERVERS_COLLECTION = "servers";
const SERVER_MEMBERS_COLLECTION = "serverMembers";
const SERVER_INVITES_COLLECTION = "serverInvites";
const SERVER_BANS_COLLECTION = "serverBans";
const SERVER_ROLES_COLLECTION = "serverRoles";
const SERVER_LOGS_COLLECTION = "serverLogs";
const SERVER_CHANNELS_COLLECTION = "serverChannels";

// =====================================================
// 🧱 SERVER VISIBILITY
// =====================================================

export const SERVER_VISIBILITY = {
  PUBLIC: "public",
  PRIVATE: "private",
  UNLISTED: "unlisted"
};

// =====================================================
// 🧱 MEMBER ROLES
// =====================================================

export const SERVER_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MODERATOR: "moderator",
  MEMBER: "member"
};

// =====================================================
// 🏗️ SERVER TEMPLATE
// =====================================================

export function createServerTemplate() {

  return {
    id: "",
    name: "",
    description: "",
    icon: "",
    banner: "",
    ownerId: "",
    visibility: SERVER_VISIBILITY.PUBLIC,
    categories: [],
    tags: [],
    rules: [],
    memberCount: 0,
    channelCount: 0,
    verified: false,
    partnered: false,
    nsfw: false,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

// =====================================================
// 🚀 CREATE SERVER
// =====================================================

export async function createServer({
  name,
  description,
  ownerId,
  icon = "",
  banner = "",
  visibility = SERVER_VISIBILITY.PUBLIC,
  tags = []
}) {

  try {

    if (!name) {
      throw new Error("Server name required");
    }

    if (!ownerId) {
      throw new Error("ownerId required");
    }

    const serverData = {
      name,
      description,
      ownerId,
      icon,
      banner,
      visibility,
      tags,
      categories: [],
      rules: [],
      memberCount: 1,
      channelCount: 0,
      verified: false,
      partnered: false,
      nsfw: false,
      archived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const serverRef = await addDoc(
      collection(db, SERVERS_COLLECTION),
      serverData
    );

    await addServerMember({
      serverId: serverRef.id,
      userId: ownerId,
      role: SERVER_ROLES.OWNER
    });

    await createDefaultChannels(serverRef.id);

    await addServerLog({
      serverId: serverRef.id,
      type: "SERVER_CREATED",
      message: `${name} server created`
    });

    return {
      success: true,
      serverId: serverRef.id
    };

  } catch (error) {

    console.error("CREATE SERVER ERROR:", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// 👥 ADD SERVER MEMBER
// =====================================================

export async function addServerMember({
  serverId,
  userId,
  role = SERVER_ROLES.MEMBER
}) {

  try {

    const memberId = `${serverId}_${userId}`;

    const memberRef = doc(db, SERVER_MEMBERS_COLLECTION, memberId);

    await setDoc(memberRef, {
      serverId,
      userId,
      role,
      joinedAt: serverTimestamp(),
      muted: false,
      banned: false
    });

    await incrementServerMembers(serverId);

    return true;

  } catch (error) {

    console.error("ADD MEMBER ERROR:", error);

    return false;
  }
}

// =====================================================
// 🚪 LEAVE SERVER
// =====================================================

export async function leaveServer({
  serverId,
  userId
}) {

  try {

    const memberId = `${serverId}_${userId}`;

    await deleteDoc(
      doc(db, SERVER_MEMBERS_COLLECTION, memberId)
    );

    await decrementServerMembers(serverId);

    return true;

  } catch (error) {

    console.error("LEAVE SERVER ERROR:", error);

    return false;
  }
}

// =====================================================
// 🔨 BAN MEMBER
// =====================================================

export async function banMember({
  serverId,
  userId,
  reason = ""
}) {

  try {

    const banId = `${serverId}_${userId}`;

    await setDoc(
      doc(db, SERVER_BANS_COLLECTION, banId),
      {
        serverId,
        userId,
        reason,
        createdAt: serverTimestamp()
      }
    );

    await leaveServer({
      serverId,
      userId
    });

    return true;

  } catch (error) {

    console.error("BAN ERROR:", error);

    return false;
  }
}

// =====================================================
// 📩 CREATE INVITE
// =====================================================

export async function createServerInvite({
  serverId,
  createdBy,
  expiresIn = 86400000
}) {

  try {

    const code = generateInviteCode();

    await setDoc(
      doc(db, SERVER_INVITES_COLLECTION, code),
      {
        code,
        serverId,
        createdBy,
        uses: 0,
        expiresAt: Date.now() + expiresIn,
        createdAt: serverTimestamp()
      }
    );

    return code;

  } catch (error) {

    console.error("INVITE ERROR:", error);

    return null;
  }
}

// =====================================================
// 🧩 JOIN SERVER BY INVITE
// =====================================================

export async function joinServerByInvite({
  inviteCode,
  userId
}) {

  try {

    const inviteRef = doc(db, SERVER_INVITES_COLLECTION, inviteCode);

    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) {
      throw new Error("Invalid invite");
    }

    const inviteData = inviteSnap.data();

    if (Date.now() > inviteData.expiresAt) {
      throw new Error("Invite expired");
    }

    await addServerMember({
      serverId: inviteData.serverId,
      userId
    });

    await updateDoc(inviteRef, {
      uses: increment(1)
    });

    return {
      success: true,
      serverId: inviteData.serverId
    };

  } catch (error) {

    console.error("JOIN INVITE ERROR:", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// 📡 LISTEN SERVER
// =====================================================

export function listenServer(serverId, callback) {

  try {

    const serverRef = doc(db, SERVERS_COLLECTION, serverId);

    const unsubscribe = onSnapshot(serverRef, (snapshot) => {

      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback({
        id: snapshot.id,
        ...snapshot.data()
      });

    });

    return unsubscribe;

  } catch (error) {

    console.error("LISTEN SERVER ERROR:", error);

    return null;
  }
}

// =====================================================
// 👥 LISTEN SERVER MEMBERS
// =====================================================

export function listenServerMembers(serverId, callback) {

  try {

    const q = query(
      collection(db, SERVER_MEMBERS_COLLECTION),
      where("serverId", "==", serverId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const members = [];

      snapshot.forEach((docItem) => {
        members.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      callback(members);

    });

    return unsubscribe;

  } catch (error) {

    console.error("LISTEN MEMBERS ERROR:", error);

    return null;
  }
}

// =====================================================
// 🛠️ UPDATE SERVER
// =====================================================

export async function updateServer({
  serverId,
  updates
}) {

  try {

    const serverRef = doc(db, SERVERS_COLLECTION, serverId);

    await updateDoc(serverRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    return true;

  } catch (error) {

    console.error("UPDATE SERVER ERROR:", error);

    return false;
  }
}

// =====================================================
// 🗑️ DELETE SERVER
// =====================================================

export async function deleteServer(serverId) {

  try {

    await deleteDoc(doc(db, SERVERS_COLLECTION, serverId));

    return true;

  } catch (error) {

    console.error("DELETE SERVER ERROR:", error);

    return false;
  }
}

// =====================================================
// 📚 GET USER SERVERS
// =====================================================

export async function getUserServers(userId) {

  try {

    const q = query(
      collection(db, SERVER_MEMBERS_COLLECTION),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    const servers = [];

    for (const memberDoc of snapshot.docs) {

      const memberData = memberDoc.data();

      const serverRef = doc(
        db,
        SERVERS_COLLECTION,
        memberData.serverId
      );

      const serverSnap = await getDoc(serverRef);

      if (serverSnap.exists()) {
        servers.push({
          id: serverSnap.id,
          ...serverSnap.data()
        });
      }
    }

    return servers;

  } catch (error) {

    console.error("GET USER SERVERS ERROR:", error);

    return [];
  }
}

// =====================================================
// 🔎 SEARCH SERVERS
// =====================================================

export async function searchServers(keyword) {

  try {

    const q = query(
      collection(db, SERVERS_COLLECTION),
      where("visibility", "==", SERVER_VISIBILITY.PUBLIC),
      limit(100)
    );

    const snapshot = await getDocs(q);

    const results = [];

    snapshot.forEach((docItem) => {

      const data = docItem.data();

      const matches =
        data.name.toLowerCase().includes(keyword.toLowerCase()) ||
        data.description.toLowerCase().includes(keyword.toLowerCase());

      if (matches) {
        results.push({
          id: docItem.id,
          ...data
        });
      }
    });

    return results;

  } catch (error) {

    console.error("SEARCH SERVERS ERROR:", error);

    return [];
  }
}

// =====================================================
// 📢 CREATE DEFAULT CHANNELS
// =====================================================

export async function createDefaultChannels(serverId) {

  try {

    const defaults = [
      {
        name: "general",
        type: "text"
      },
      {
        name: "welcome",
        type: "text"
      }
    ];

    for (const channel of defaults) {

      await addDoc(
        collection(db, SERVER_CHANNELS_COLLECTION),
        {
          serverId,
          ...channel,
          createdAt: serverTimestamp()
        }
      );
    }

    return true;

  } catch (error) {

    console.error("DEFAULT CHANNEL ERROR:", error);

    return false;
  }
}

// =====================================================
// 📈 INCREMENT MEMBERS
// =====================================================

export async function incrementServerMembers(serverId) {

  try {

    const serverRef = doc(db, SERVERS_COLLECTION, serverId);

    await updateDoc(serverRef, {
      memberCount: increment(1)
    });

    return true;

  } catch (error) {

    console.error("INCREMENT MEMBERS ERROR:", error);

    return false;
  }
}

// =====================================================
// 📉 DECREMENT MEMBERS
// =====================================================

export async function decrementServerMembers(serverId) {

  try {

    const serverRef = doc(db, SERVERS_COLLECTION, serverId);

    await updateDoc(serverRef, {
      memberCount: increment(-1)
    });

    return true;

  } catch (error) {

    console.error("DECREMENT MEMBERS ERROR:", error);

    return false;
  }
}

// =====================================================
// 📝 SERVER LOGS
// =====================================================

export async function addServerLog({
  serverId,
  type,
  message
}) {

  try {

    await addDoc(collection(db, SERVER_LOGS_COLLECTION), {
      serverId,
      type,
      message,
      createdAt: serverTimestamp()
    });

    return true;

  } catch (error) {

    console.error("SERVER LOG ERROR:", error);

    return false;
  }
}

// =====================================================
// 🎲 GENERATE INVITE CODE
// =====================================================

export function generateInviteCode(length = 10) {

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let code = "";

  for (let i = 0; i < length; i++) {
    code += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return code;
}

// =====================================================
// 🧹 CLEAN SERVER LOGS
// =====================================================

export async function cleanServerLogs(serverId) {

  try {

    const q = query(
      collection(db, SERVER_LOGS_COLLECTION),
      where("serverId", "==", serverId)
    );

    const snapshot = await getDocs(q);

    const batch = writeBatch(db);

    snapshot.forEach((docItem) => {
      batch.delete(docItem.ref);
    });

    await batch.commit();

    return true;

  } catch (error) {

    console.error("CLEAN LOGS ERROR:", error);

    return false;
  }
}

// =====================================================
// 📤 EXPORT DEFAULT
// =====================================================

export default {
  SERVER_VISIBILITY,
  SERVER_ROLES,
  createServerTemplate,
  createServer,
  addServerMember,
  leaveServer,
  banMember,
  createServerInvite,
  joinServerByInvite,
  listenServer,
  listenServerMembers,
  updateServer,
  deleteServer,
  getUserServers,
  searchServers,
  createDefaultChannels,
  incrementServerMembers,
  decrementServerMembers,
  addServerLog,
  generateInviteCode,
  cleanServerLogs
};

```
