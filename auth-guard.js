import { auth } from "./firebase.js";

export function checkAuthSystem() {
  const status = {
    firebaseReady: !!auth,
    domain: window.location.hostname,
    https: location.protocol === "https:",
  };

  console.log("🧠 Auth Check:", status);

  if (!status.firebaseReady) {
    console.error("❌ Firebase not initialized");
    return false;
  }

  if (!status.https) {
    console.warn("⚠️ Not using HTTPS (can break Google login)");
  }

  return true;
}

export function logAuthError(error) {
  console.error("🔥 AUTH ERROR:", {
    code: error.code,
    message: error.message,
  });

  switch (error.code) {
    case "auth/unauthorized-domain":
      alert("Domain not allowed in Firebase Console");
      break;

    case "auth/popup-blocked":
      alert("Popup blocked by browser");
      break;

    case "auth/operation-not-allowed":
      alert("Google login not enabled in Firebase");
      break;

    default:
      alert("Login failed: " + error.message);
  }
}
