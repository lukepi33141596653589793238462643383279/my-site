# permissions.db.js

```javascript
// =========================================================
// 🔐 PERMISSIONS DATABASE MODULE
// University Chat for Software Engineering
// Enterprise Modular Architecture
// =========================================================

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../firebase.js";

// =========================================================
// 📦 COLLECTIONS
// =========================================================

const PERMISSIONS_COLLECTION = "permissions";
const ROLE_PERMISSIONS_COLLECTION = "role_permissions";
const CHANNEL_PERMISSIONS_COLLECTION = "channel_permissions";
const SERVER_PERMISSIONS_COLLECTION = "server_permissions";
const AUDIT_PERMISSIONS_COLLECTION = "permissions_audit";

// =========================================================
// 🧠 CACHE SYSTEM
// =========================================================

const permissionsCache = new Map();
const rolePermissionsCache = new Map();
const channelPermissionsCache = new Map();
const serverPermissionsCache = new Map();

// =========================================================
// 🔑 DEFAULT PERMISSIONS
// =========================================================

export const DEFAULT_PERMISSIONS = {
  ADMINISTRATOR: true,
  MANAGE_SERVER: true,
  MANAGE_CHANNELS: true,
  MANAGE_ROLES: true,
  MANAGE_PERMISSIONS: true,
  MANAGE_MESSAGES: true,
  MANAGE_MEMBERS: true,
  MANAGE_THREADS: true,
  VIEW_CHANNELS: true,
  SEND_MESSAGES: true,
  EDIT_MESSAGES: true,
  DELETE_MESSAGES: true,
  ATTACH_FILES: true,
  EMBED_LINKS: true,
  ADD_REACTIONS: true,
  USE_EXTERNAL_EMOJIS: true,
  CREATE_INVITES: true,
  CONNECT_VOICE: true,
  SPEAK_VOICE: true,
  STREAM_VIDEO: true,
  PRIORITY_SPEAKER: false,
  MUTE_MEMBERS: true,
  DEAFEN_MEMBERS: true,
  MOVE_MEMBERS: true,
  BAN_MEMBERS: true,
  KICK_MEMBERS: true,
  VIEW_AUDIT_LOG: true,
  CHANGE_NICKNAME: true,
  MANAGE_NICKNAMES: true,
  CREATE_POSTS: true,
  EDIT_POSTS: true,
  DELETE_POSTS: true,
  PIN_MESSAGES: true,
  CREATE_THREADS: true,
  ARCHIVE_THREADS: true,
  LOCK_THREADS: true,
  USE_BOTS: true,
  USE_AI_FEATURES: true,
  ACCESS_PREMIUM_CHANNELS: false,
  CREATE_EVENTS: true,
  MANAGE_EVENTS: true,
  VIEW_ANALYTICS: true,
  EXPORT_DATA: false,
  IMPORT_DATA: false,
  VIEW_PRIVATE_CHANNELS: false,
  BYPASS_SLOWMODE: false,
  MANAGE_WEBHOOKS: true,
  CREATE_WEBHOOKS: true,
  DELETE_WEBHOOKS: true,
  VIEW_SERVER_STATS: true,
  MANAGE_FORUMS: true,
  CREATE_FORUM_POSTS: true,
  DELETE_FORUM_POSTS: true,
  MODERATE_CONTENT: true,
  FLAG_CONTENT: true,
  VERIFY_USERS: false,
  MANAGE_BOTS: true,
  ACCESS_DEVELOPER_TOOLS: false,
  EXECUTE_ADMIN_ACTIONS: false,
  VIEW_HIDDEN_CHANNELS: false,
  SYSTEM_OVERRIDE: false
};

// =========================================================
// 🛠️ UTILITIES
// =========================================================

function validatePermissionKey(permission) {
  return Object.prototype.hasOwnProperty.call(DEFAULT_PERMISSIONS, permission);
}

function createEmptyPermissions() {
  const permissions = {};

  for (const key in DEFAULT_PERMISSIONS) {
    permissions[key] = false;
  }

  return permissions;
}

function sanitizePermissions(inputPermissions = {}) {
  const sanitized = createEmptyPermissions();

  for (const key in inputPermissions) {
    if (validatePermissionKey(key)) {
      sanitized[key] = Boolean(inputPermissions[key]);
    }
  }

  return sanitized;
}

function mergePermissions(basePermissions = {}, extraPermissions = {}) {
  const merged = { ...basePermissions };

  for (const key in extraPermissions) {
    if (validatePermissionKey(key)) {
      merged[key] = extraPermissions[key];
    }
  }

  return merged;
}

function generatePermissionId() {
  return `permission_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 12)}`;
}

function logPermissionError(context, error) {
  console.error(`❌ Permission Error [${context}]`, error);
}

function logPermissionSuccess(context, data = null) {
  console.log(`✅ Permission Success [${context}]`, data || "OK");
}

// =========================================================
// 🧱 CREATE USER PERMISSIONS
// =========================================================

export async function createUserPermissions({
  userId,
  serverId,
  permissions = {},
  createdBy = null
}) {
  try {
    if (!userId || !serverId) {
      throw new Error("Missing userId or serverId");
    }

    const permissionId = generatePermissionId();

    const finalPermissions = sanitizePermissions(permissions);

    const permissionData = {
      permissionId,
      userId,
      serverId,
      permissions: finalPermissions,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      active: true
    };

    await setDoc(
      doc(db, PERMISSIONS_COLLECTION, permissionId),
      permissionData
    );

    permissionsCache.set(permissionId, permissionData);

    await createPermissionAuditLog({
      action: "CREATE_USER_PERMISSIONS",
      targetId: userId,
      serverId,
      performedBy: createdBy
    });

    logPermissionSuccess("createUserPermissions", permissionData);

    return {
      success: true,
      permissionId,
      data: permissionData
    };
  } catch (error) {
    logPermissionError("createUserPermissions", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =========================================================
// 📥 GET USER PERMISSIONS
// =========================================================

export async function getUserPermissions(userId, serverId) {
  try {
    const q = query(
      collection(db, PERMISSIONS_COLLECTION),
      where("userId", "==", userId),
      where("serverId", "==", serverId),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return createEmptyPermissions();
    }

    const permissionDoc = snapshot.docs[0];

    const permissionData = {
      id: permissionDoc.id,
      ...permissionDoc.data()
    };

    permissionsCache.set(permissionDoc.id, permissionData);

    return permissionData.permissions || createEmptyPermissions();
  } catch (error) {
    logPermissionError("getUserPermissions", error);

    return createEmptyPermissions();
  }
}

// =========================================================
// ✏️ UPDATE USER PERMISSIONS
// =========================================================

export async function updateUserPermissions({
  permissionId,
  permissions,
  updatedBy = null
}) {
  try {
    if (!permissionId) {
      throw new Error("Permission ID is required");
    }

    const permissionRef = doc(db, PERMISSIONS_COLLECTION, permissionId);

    const permissionDoc = await getDoc(permissionRef);

    if (!permissionDoc.exists()) {
      throw new Error("Permission document not found");
    }

    const currentData = permissionDoc.data();

    const updatedPermissions = mergePermissions(
      currentData.permissions,
      sanitizePermissions(permissions)
    );

    await updateDoc(permissionRef, {
      permissions: updatedPermissions,
      updatedAt: serverTimestamp(),
      updatedBy
    });

    permissionsCache.set(permissionId, {
      ...currentData,
      permissions: updatedPermissions
    });

    await createPermissionAuditLog({
      action: "UPDATE_USER_PERMISSIONS",
      targetId: currentData.userId,
      serverId: currentData.serverId,
      performedBy: updatedBy
    });

    logPermissionSuccess("updateUserPermissions");

    return {
      success: true,
      permissions: updatedPermissions
    };
  } catch (error) {
    logPermissionError("updateUserPermissions", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =========================================================
// ❌ DELETE USER PERMISSIONS
// =========================================================

export async function deleteUserPermissions(permissionId) {
  try {
    if (!permissionId) {
      throw new Error("Permission ID missing");
    }

    await deleteDoc(doc(db, PERMISSIONS_COLLECTION, permissionId));

    permissionsCache.delete(permissionId);

    logPermissionSuccess("deleteUserPermissions");

    return {
      success: true
    };
  } catch (error) {
    logPermissionError("deleteUserPermissions", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =========================================================
// 🏷️ ROLE PERMISSIONS
// =========================================================

export async function createRolePermissions({
  roleId,
  serverId,
  permissions = {},
  createdBy = null
}) {
  try {
    const rolePermissionId = generatePermissionId();

    const rolePermissionData = {
      rolePermissionId,
      roleId,
      serverId,
      permissions: sanitizePermissions(permissions),
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      active: true
    };

    await setDoc(
      doc(db, ROLE_PERMISSIONS_COLLECTION, rolePermissionId),
      rolePermissionData
    );

    rolePermissionsCache.set(rolePermissionId, rolePermissionData);

    logPermissionSuccess("createRolePermissions");

    return {
      success: true,
      data: rolePermissionData
    };
  } catch (error) {
    logPermissionError("createRolePermissions", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =========================================================
// 📚 GET ROLE PERMISSIONS
// =========================================================

export async function getRolePermissions(roleId, serverId) {
  try {
    const q = query(
      collection(db, ROLE_PERMISSIONS_COLLECTION),
      where("roleId", "==", roleId),
      where("serverId", "==", serverId),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return createEmptyPermissions();
    }

    const rolePermissionDoc = snapshot.docs[0];

    const rolePermissionData = rolePermissionDoc.data();

    rolePermissionsCache.set(rolePermissionDoc.id, rolePermissionData);

    return rolePermissionData.permissions;
  } catch (error) {
    logPermissionError("getRolePermissions", error);

    return createEmptyPermissions();
  }
}

// =========================================================
// 🧩 CHANNEL PERMISSIONS
// =========================================================

export async function createChannelPermissions({
  channelId,
  serverId,
  permissions = {},
  createdBy = null
}) {
  try {
    const channelPermissionId = generatePermissionId();

    const channelPermissionData = {
      channelPermissionId,
      channelId,
      serverId,
      permissions: sanitizePermissions(permissions),
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      active: true
    };

    await setDoc(
      doc(db, CHANNEL_PERMISSIONS_COLLECTION, channelPermissionId),
      channelPermissionData
    );

    channelPermissionsCache.set(
      channelPermissionId,
      channelPermissionData
    );

    logPermissionSuccess("createChannelPermissions");

    return {
      success: true,
      data: channelPermissionData
    };
  } catch (error) {
    logPermissionError("createChannelPermissions", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =========================================================
// 📡 GET CHANNEL PERMISSIONS
// =========================================================

export async function getChannelPermissions(channelId, serverId) {
  try {
    const q = query(
      collection(db, CHANNEL_PERMISSIONS_COLLECTION),
      where("channelId", "==", channelId),
      where("serverId", "==", serverId),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return createEmptyPermissions();
    }

    const channelPermissionDoc = snapshot.docs[0];

    const channelPermissionData = channelPermissionDoc.data();

    return channelPermissionData.permissions;
  } catch (error) {
    logPermissionError("getChannelPermissions", error);

    return createEmptyPermissions();
  }
}

// =========================================================
// 🌍 SERVER PERMISSIONS
// =========================================================

export async function createServerPermissions({
  serverId,
  permissions = {},
  createdBy = null
}) {
  try {
    const serverPermissionId = generatePermissionId();

    const serverPermissionData = {
      serverPermissionId,
      serverId,
      permissions: sanitizePermissions(permissions),
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      active: true
    };

    await setDoc(
      doc(db, SERVER_PERMISSIONS_COLLECTION, serverPermissionId),
      serverPermissionData
    );

    serverPermissionsCache.set(serverPermissionId, serverPermissionData);

    logPermissionSuccess("createServerPermissions");

    return {
      success: true,
      data: serverPermissionData
    };
  } catch (error) {
    logPermissionError("createServerPermissions", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =========================================================
// 🔎 CHECK PERMISSION
// =========================================================

export function hasPermission(permissions, permissionKey) {
  try {
    if (!permissions) {
      return false;
    }

    if (!validatePermissionKey(permissionKey)) {
      return false;
    }

    if (permissions.ADMINISTRATOR === true) {
      return true;
    }

    return permissions[permissionKey] === true;
  } catch (error) {
    logPermissionError("hasPermission", error);

    return false;
  }
}

// =========================================================
// 🧮 CALCULATE FINAL USER PERMISSIONS
// =========================================================

export async function calculateFinalPermissions({
  userPermissions = {},
  rolePermissions = [],
  channelPermissions = {}
}) {
  try {
    let finalPermissions = createEmptyPermissions();

    finalPermissions = mergePermissions(
      finalPermissions,
      userPermissions
    );

    for (const rolePermission of rolePermissions) {
      finalPermissions = mergePermissions(
        finalPermissions,
        rolePermission
      );
    }

    finalPermissions = mergePermissions(
      finalPermissions,
      channelPermissions
    );

    return finalPermissions;
  } catch (error) {
    logPermissionError("calculateFinalPermissions", error);

    return createEmptyPermissions();
  }
}

// =========================================================
// 📡 REALTIME LISTENER
// =========================================================

export function listenToUserPermissions(
  userId,
  serverId,
  callback
) {
  try {
    const q = query(
      collection(db, PERMISSIONS_COLLECTION),
      where("userId", "==", userId),
      where("serverId", "==", serverId)
    );

    return onSnapshot(q, (snapshot) => {
      const permissions = [];

      snapshot.forEach((docItem) => {
        permissions.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      callback(permissions);
    });
  } catch (error) {
    logPermissionError("listenToUserPermissions", error);
  }
}

// =========================================================
// 📝 AUDIT LOGS
// =========================================================

export async function createPermissionAuditLog({
  action,
  targetId,
  serverId,
  performedBy
}) {
  try {
    const auditData = {
      action,
      targetId,
      serverId,
      performedBy,
      createdAt: serverTimestamp()
    };

    await addDoc(
      collection(db, AUDIT_PERMISSIONS_COLLECTION),
      auditData
    );

    return {
      success: true
    };
  } catch (error) {
    logPermissionError("createPermissionAuditLog", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =========================================================
// 📜 GET AUDIT LOGS
// =========================================================

export async function getPermissionAuditLogs(serverId) {
  try {
    const q = query(
      collection(db, AUDIT_PERMISSIONS_COLLECTION),
      where("serverId", "==", serverId),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const snapshot = await getDocs(q);

    const logs = [];

    snapshot.forEach((docItem) => {
      logs.push({
        id: docItem.id,
        ...docItem.data()
      });
    });

    return logs;
  } catch (error) {
    logPermissionError("getPermissionAuditLogs", error);

    return [];
  }
}

// =========================================================
// 🧹 CACHE MANAGEMENT
// =========================================================

export function clearPermissionsCache() {
  permissionsCache.clear();
  rolePermissionsCache.clear();
  channelPermissionsCache.clear();
  serverPermissionsCache.clear();

  logPermissionSuccess("clearPermissionsCache");
}

export function getPermissionsCacheSize() {
  return {
    permissions: permissionsCache.size,
    roles: rolePermissionsCache.size,
    channels: channelPermissionsCache.size,
    servers: serverPermissionsCache.size
  };
}

// =========================================================
// 🛡️ SECURITY CHECKS
// =========================================================

export function isAdministrator(permissions) {
  return permissions?.ADMINISTRATOR === true;
}

export function canManageServer(permissions) {
  return hasPermission(permissions, "MANAGE_SERVER");
}

export function canManageChannels(permissions) {
  return hasPermission(permissions, "MANAGE_CHANNELS");
}

export function canManageRoles(permissions) {
  return hasPermission(permissions, "MANAGE_ROLES");
}

export function canManageMessages(permissions) {
  return hasPermission(permissions, "MANAGE_MESSAGES");
}

export function canSendMessages(permissions) {
  return hasPermission(permissions, "SEND_MESSAGES");
}

export function canDeleteMessages(permissions) {
  return hasPermission(permissions, "DELETE_MESSAGES");
}

export function canBanMembers(permissions) {
  return hasPermission(permissions, "BAN_MEMBERS");
}

export function canKickMembers(permissions) {
  return hasPermission(permissions, "KICK_MEMBERS");
}

export function canMuteMembers(permissions) {
  return hasPermission(permissions, "MUTE_MEMBERS");
}

export function canCreatePosts(permissions) {
  return hasPermission(permissions, "CREATE_POSTS");
}

export function canEditPosts(permissions) {
  return hasPermission(permissions, "EDIT_POSTS");
}

export function canDeletePosts(permissions) {
  return hasPermission(permissions, "DELETE_POSTS");
}

export function canUseAI(permissions) {
  return hasPermission(permissions, "USE_AI_FEATURES");
}

export function canViewAnalytics(permissions) {
  return hasPermission(permissions, "VIEW_ANALYTICS");
}

export function canExportData(permissions) {
  return hasPermission(permissions, "EXPORT_DATA");
}

export function canImportData(permissions) {
  return hasPermission(permissions, "IMPORT_DATA");
}

export function canModerateContent(permissions) {
  return hasPermission(permissions, "MODERATE_CONTENT");
}

export function canUseBots(permissions) {
  return hasPermission(permissions, "USE_BOTS");
}

export function canManageBots(permissions) {
  return hasPermission(permissions, "MANAGE_BOTS");
}

export function canAccessDeveloperTools(permissions) {
  return hasPermission(permissions, "ACCESS_DEVELOPER_TOOLS");
}

export function canExecuteAdminActions(permissions) {
  return hasPermission(permissions, "EXECUTE_ADMIN_ACTIONS");
}

// =========================================================
// 🔄 RESET PERMISSIONS
// =========================================================

export async function resetUserPermissions(permissionId) {
  try {
    const permissionRef = doc(db, PERMISSIONS_COLLECTION, permissionId);

    await updateDoc(permissionRef, {
      permissions: createEmptyPermissions(),
      updatedAt: serverTimestamp()
    });

    logPermissionSuccess("resetUserPermissions");

    return {
      success: true
    };
  } catch (error) {
    logPermissionError("resetUserPermissions", error);

    return {
      success: false,
      error: error.message
    };
  }
}

// =========================================================
// 📊 PERMISSION ANALYTICS
// =========================================================

export async function getPermissionAnalytics(serverId) {
  try {
    const q = query(
      collection(db, PERMISSIONS_COLLECTION),
      where("serverId", "==", serverId)
    );

    const snapshot = await getDocs(q);

    const analytics = {
      totalUsers: 0,
      administrators: 0,
      moderators: 0,
      normalUsers: 0
    };

    snapshot.forEach((docItem) => {
      analytics.totalUsers += 1;

      const data = docItem.data();

      if (data.permissions?.ADMINISTRATOR) {
        analytics.administrators += 1;
      } else if (data.permissions?.MANAGE_MESSAGES) {
        analytics.moderators += 1;
      } else {
        analytics.normalUsers += 1;
      }
    });

    return analytics;
  } catch (error) {
    logPermissionError("getPermissionAnalytics", error);

    return {
      totalUsers: 0,
      administrators: 0,
      moderators: 0,
      normalUsers: 0
    };
  }
}

// =========================================================
// 🧪 DEVELOPMENT TOOLS
// =========================================================

export function printPermissions(permissions) {
  console.table(permissions);
}

export function listEnabledPermissions(permissions) {
  const enabled = [];

  for (const key in permissions) {
    if (permissions[key] === true) {
      enabled.push(key);
    }
  }

  return enabled;
}

export function listDisabledPermissions(permissions) {
  const disabled = [];

  for (const key in permissions) {
    if (permissions[key] === false) {
      disabled.push(key);
    }
  }

  return disabled;
}

// =========================================================
// 🚀 MODULE READY
// =========================================================

console.log("🔐 permissions.db.js loaded successfully");

export default {
  DEFAULT_PERMISSIONS,
  createUserPermissions,
  getUserPermissions,
  updateUserPermissions,
  deleteUserPermissions,
  createRolePermissions,
  getRolePermissions,
  createChannelPermissions,
  getChannelPermissions,
  createServerPermissions,
  calculateFinalPermissions,
  listenToUserPermissions,
  createPermissionAuditLog,
  getPermissionAuditLogs,
  clearPermissionsCache,
  getPermissionsCacheSize,
  resetUserPermissions,
  getPermissionAnalytics,
  hasPermission,
  isAdministrator,
  canManageServer,
  canManageChannels,
  canManageRoles,
  canManageMessages,
  canSendMessages,
  canDeleteMessages,
  canBanMembers,
  canKickMembers,
  canMuteMembers,
  canCreatePosts,
  canEditPosts,
  canDeletePosts,
  canUseAI,
  canViewAnalytics,
  canExportData,
  canImportData,
  canModerateContent,
  canUseBots,
  canManageBots,
  canAccessDeveloperTools,
  canExecuteAdminActions,
  printPermissions,
  listEnabledPermissions,
  listDisabledPermissions
};

// =========================================================
// 📦 END OF MODULE
// =========================================================
```
