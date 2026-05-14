# db/roles.db.js

```javascript
// =====================================================
// 🛡️ roles.db.js
// Discord Style Roles & Permissions System
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

const ROLES_COLLECTION = "roles";
const ROLE_PERMISSIONS_COLLECTION = "rolePermissions";
const USER_ROLES_COLLECTION = "userRoles";
const ROLE_LOGS_COLLECTION = "roleLogs";
const CHANNEL_PERMISSIONS_COLLECTION = "channelPermissions";

// =====================================================
// 🔐 DEFAULT PERMISSIONS
// =====================================================

export const PERMISSIONS = {
  ADMINISTRATOR: "administrator",
  MANAGE_SERVER: "manage_server",
  MANAGE_CHANNELS: "manage_channels",
  MANAGE_ROLES: "manage_roles",
  MANAGE_MESSAGES: "manage_messages",
  MANAGE_MEMBERS: "manage_members",
  KICK_MEMBERS: "kick_members",
  BAN_MEMBERS: "ban_members",
  VIEW_CHANNELS: "view_channels",
  SEND_MESSAGES: "send_messages",
  EDIT_MESSAGES: "edit_messages",
  DELETE_MESSAGES: "delete_messages",
  ATTACH_FILES: "attach_files",
  EMBED_LINKS: "embed_links",
  MENTION_EVERYONE: "mention_everyone",
  USE_REACTIONS: "use_reactions",
  CONNECT_VOICE: "connect_voice",
  SPEAK_VOICE: "speak_voice",
  STREAM_VIDEO: "stream_video",
  PRIORITY_SPEAKER: "priority_speaker"
};

// =====================================================
// 🎨 ROLE COLORS
// =====================================================

export const ROLE_COLORS = {
  RED: "#ff0000",
  BLUE: "#0099ff",
  GREEN: "#00cc66",
  YELLOW: "#ffcc00",
  PURPLE: "#9933ff",
  ORANGE: "#ff6600",
  WHITE: "#ffffff",
  GRAY: "#808080"
};

// =====================================================
// 🏗️ ROLE TEMPLATE
// =====================================================

export function createRoleTemplate() {

  return {
    id: "",
    serverId: "",
    name: "",
    color: ROLE_COLORS.GRAY,
    icon: "",
    permissions: [],
    priority: 0,
    mentionable: true,
    hoist: false,
    managed: false,
    createdBy: "",
    memberCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

// =====================================================
// 🚀 CREATE ROLE
// =====================================================

export async function createRole({
  serverId,
  name,
  color = ROLE_COLORS.GRAY,
  permissions = [],
  createdBy
}) {

  try {

    if (!serverId) {
      throw new Error("serverId required");
    }

    if (!name) {
      throw new Error("role name required");
    }

    const roleData = {
      serverId,
      name,
      color,
      icon: "",
      permissions,
      priority: 0,
      mentionable: true,
      hoist: false,
      managed: false,
      createdBy,
      memberCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const roleRef = await addDoc(
      collection(db, ROLES_COLLECTION),
      roleData
    );

    await addRoleLog({
      serverId,
      action: "ROLE_CREATED",
      message: `${name} role created`
    });

    return {
      success: true,
      roleId: roleRef.id
    };

  } catch (error) {

    console.error("CREATE ROLE ERROR:", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// 👤 ASSIGN ROLE TO USER
// =====================================================

export async function assignRoleToUser({
  serverId,
  roleId,
  userId
}) {

  try {

    const userRoleId = `${serverId}_${roleId}_${userId}`;

    await setDoc(
      doc(db, USER_ROLES_COLLECTION, userRoleId),
      {
        serverId,
        roleId,
        userId,
        assignedAt: serverTimestamp()
      }
    );

    await incrementRoleMembers(roleId);

    return true;

  } catch (error) {

    console.error("ASSIGN ROLE ERROR:", error);

    return false;
  }
}

// =====================================================
// ❌ REMOVE ROLE FROM USER
// =====================================================

export async function removeRoleFromUser({
  serverId,
  roleId,
  userId
}) {

  try {

    const userRoleId = `${serverId}_${roleId}_${userId}`;

    await deleteDoc(
      doc(db, USER_ROLES_COLLECTION, userRoleId)
    );

    await decrementRoleMembers(roleId);

    return true;

  } catch (error) {

    console.error("REMOVE ROLE ERROR:", error);

    return false;
  }
}

// =====================================================
// 🔐 UPDATE ROLE PERMISSIONS
// =====================================================

export async function updateRolePermissions({
  roleId,
  permissions
}) {

  try {

    const roleRef = doc(db, ROLES_COLLECTION, roleId);

    await updateDoc(roleRef, {
      permissions,
      updatedAt: serverTimestamp()
    });

    return true;

  } catch (error) {

    console.error("PERMISSION UPDATE ERROR:", error);

    return false;
  }
}

// =====================================================
// ➕ ADD PERMISSION
// =====================================================

export async function addPermission({
  roleId,
  permission
}) {

  try {

    const roleRef = doc(db, ROLES_COLLECTION, roleId);

    await updateDoc(roleRef, {
      permissions: arrayUnion(permission),
      updatedAt: serverTimestamp()
    });

    return true;

  } catch (error) {

    console.error("ADD PERMISSION ERROR:", error);

    return false;
  }
}

// =====================================================
// ➖ REMOVE PERMISSION
// =====================================================

export async function removePermission({
  roleId,
  permission
}) {

  try {

    const roleRef = doc(db, ROLES_COLLECTION, roleId);

    await updateDoc(roleRef, {
      permissions: arrayRemove(permission),
      updatedAt: serverTimestamp()
    });

    return true;

  } catch (error) {

    console.error("REMOVE PERMISSION ERROR:", error);

    return false;
  }
}

// =====================================================
// 🧠 CHECK USER PERMISSION
// =====================================================

export async function userHasPermission({
  serverId,
  userId,
  permission
}) {

  try {

    const q = query(
      collection(db, USER_ROLES_COLLECTION),
      where("serverId", "==", serverId),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    for (const docItem of snapshot.docs) {

      const roleData = docItem.data();

      const roleRef = doc(db, ROLES_COLLECTION, roleData.roleId);

      const roleSnap = await getDoc(roleRef);

      if (!roleSnap.exists()) {
        continue;
      }

      const role = roleSnap.data();

      if (
        role.permissions.includes(PERMISSIONS.ADMINISTRATOR)
      ) {
        return true;
      }

      if (role.permissions.includes(permission)) {
        return true;
      }
    }

    return false;

  } catch (error) {

    console.error("CHECK PERMISSION ERROR:", error);

    return false;
  }
}

// =====================================================
// 📡 LISTEN SERVER ROLES
// =====================================================

export function listenServerRoles(serverId, callback) {

  try {

    const q = query(
      collection(db, ROLES_COLLECTION),
      where("serverId", "==", serverId),
      orderBy("priority", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const roles = [];

      snapshot.forEach((docItem) => {
        roles.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      callback(roles);

    });

    return unsubscribe;

  } catch (error) {

    console.error("LISTEN ROLES ERROR:", error);

    return null;
  }
}

// =====================================================
// 👂 LISTEN USER ROLES
// =====================================================

export function listenUserRoles({
  serverId,
  userId,
  callback
}) {

  try {

    const q = query(
      collection(db, USER_ROLES_COLLECTION),
      where("serverId", "==", serverId),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const roles = [];

      snapshot.forEach((docItem) => {
        roles.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      callback(roles);

    });

    return unsubscribe;

  } catch (error) {

    console.error("LISTEN USER ROLES ERROR:", error);

    return null;
  }
}

// =====================================================
// 📚 GET SERVER ROLES
// =====================================================

export async function getServerRoles(serverId) {

  try {

    const q = query(
      collection(db, ROLES_COLLECTION),
      where("serverId", "==", serverId),
      orderBy("priority", "desc")
    );

    const snapshot = await getDocs(q);

    const roles = [];

    snapshot.forEach((docItem) => {
      roles.push({
        id: docItem.id,
        ...docItem.data()
      });
    });

    return roles;

  } catch (error) {

    console.error("GET ROLES ERROR:", error);

    return [];
  }
}

// =====================================================
// 🎚️ UPDATE ROLE POSITION
// =====================================================

export async function updateRolePriority({
  roleId,
  priority
}) {

  try {

    const roleRef = doc(db, ROLES_COLLECTION, roleId);

    await updateDoc(roleRef, {
      priority,
      updatedAt: serverTimestamp()
    });

    return true;

  } catch (error) {

    console.error("PRIORITY ERROR:", error);

    return false;
  }
}

// =====================================================
// 🎨 UPDATE ROLE STYLE
// =====================================================

export async function updateRoleStyle({
  roleId,
  color,
  icon
}) {

  try {

    const roleRef = doc(db, ROLES_COLLECTION, roleId);

    await updateDoc(roleRef, {
      color,
      icon,
      updatedAt: serverTimestamp()
    });

    return true;

  } catch (error) {

    console.error("STYLE UPDATE ERROR:", error);

    return false;
  }
}

// =====================================================
// 🧹 DELETE ROLE
// =====================================================

export async function deleteRole(roleId) {

  try {

    await deleteDoc(doc(db, ROLES_COLLECTION, roleId));

    return true;

  } catch (error) {

    console.error("DELETE ROLE ERROR:", error);

    return false;
  }
}

// =====================================================
// 📈 INCREMENT ROLE MEMBERS
// =====================================================

export async function incrementRoleMembers(roleId) {

  try {

    const roleRef = doc(db, ROLES_COLLECTION, roleId);

    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      return false;
    }

    const data = roleSnap.data();

    await updateDoc(roleRef, {
      memberCount: (data.memberCount || 0) + 1
    });

    return true;

  } catch (error) {

    console.error("INCREMENT MEMBERS ERROR:", error);

    return false;
  }
}

// =====================================================
// 📉 DECREMENT ROLE MEMBERS
// =====================================================

export async function decrementRoleMembers(roleId) {

  try {

    const roleRef = doc(db, ROLES_COLLECTION, roleId);

    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      return false;
    }

    const data = roleSnap.data();

    await updateDoc(roleRef, {
      memberCount: Math.max((data.memberCount || 1) - 1, 0)
    });

    return true;

  } catch (error) {

    console.error("DECREMENT MEMBERS ERROR:", error);

    return false;
  }
}

// =====================================================
// 📝 ROLE LOGS
// =====================================================

export async function addRoleLog({
  serverId,
  action,
  message
}) {

  try {

    await addDoc(collection(db, ROLE_LOGS_COLLECTION), {
      serverId,
      action,
      message,
      createdAt: serverTimestamp()
    });

    return true;

  } catch (error) {

    console.error("ROLE LOG ERROR:", error);

    return false;
  }
}

// =====================================================
// 🔒 CHANNEL PERMISSIONS
// =====================================================

export async function setChannelPermission({
  channelId,
  roleId,
  permissions
}) {

  try {

    const permissionId = `${channelId}_${roleId}`;

    await setDoc(
      doc(db, CHANNEL_PERMISSIONS_COLLECTION, permissionId),
      {
        channelId,
        roleId,
        permissions,
        updatedAt: serverTimestamp()
      }
    );

    return true;

  } catch (error) {

    console.error("CHANNEL PERMISSION ERROR:", error);

    return false;
  }
}

// =====================================================
// 🧹 CLEAN ROLE LOGS
// =====================================================

export async function cleanRoleLogs(serverId) {

  try {

    const q = query(
      collection(db, ROLE_LOGS_COLLECTION),
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

    console.error("CLEAN ROLE LOGS ERROR:", error);

    return false;
  }
}

// =====================================================
// 📤 EXPORT DEFAULT
// =====================================================

export default {
  PERMISSIONS,
  ROLE_COLORS,
  createRoleTemplate,
  createRole,
  assignRoleToUser,
  removeRoleFromUser,
  updateRolePermissions,
  addPermission,
  removePermission,
  userHasPermission,
  listenServerRoles,
  listenUserRoles,
  getServerRoles,
  updateRolePriority,
  updateRoleStyle,
  deleteRole,
  incrementRoleMembers,
  decrementRoleMembers,
  addRoleLog,
  setChannelPermission,
  cleanRoleLogs
};

```
