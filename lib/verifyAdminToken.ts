import { cookies } from "next/headers";
import { adminAuth } from "./firebaseAdmin";

export async function verifyAdminToken(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) return false;
    const decoded = await adminAuth.verifyIdToken(token);
    return !!decoded.admin;
  } catch {
    return false;
  }
}
