import { adminAuth } from "./lib/firebaseAdmin.ts";

async function setAdmin(uid) {
  await adminAuth.setCustomUserClaims(uid, { admin: true });
  console.log("Admin role assigned");
}

setAdmin("Jaq7TYOM22bP6sERHoBcm11uo2W2");
