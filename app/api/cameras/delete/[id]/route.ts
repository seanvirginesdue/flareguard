import { db } from "@/lib/firebaseConfig";
import { doc, deleteDoc, getDoc } from "firebase/firestore";
import { verifyAdminToken } from "@/lib/verifyAdminToken";

export const runtime = "nodejs";

const VALID_ID = /^[a-zA-Z0-9_-]+$/;

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await verifyAdminToken();
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { id } = await params;

  if (!id || !VALID_ID.test(id)) {
    return new Response(JSON.stringify({ error: "Invalid camera ID" }), { status: 400 });
  }

  try {
    const ref = doc(db, "cameras", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return new Response(JSON.stringify({ error: "Camera not found" }), { status: 404 });
    }

    await deleteDoc(ref);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Delete camera error:", err);
    return new Response(JSON.stringify({ error: "Failed to delete camera" }), { status: 500 });
  }
}
