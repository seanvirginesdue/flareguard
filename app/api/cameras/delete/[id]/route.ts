import { db } from "@/lib/firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteDoc(doc(db, "cameras", id));
    return new Response("Camera deleted", { status: 200 });
  } catch (err) {
    console.error("Delete camera error:", err);
    return new Response("Failed to delete camera", { status: 500 });
  }
}
