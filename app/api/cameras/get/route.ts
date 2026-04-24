import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { verifyAdminToken } from "@/lib/verifyAdminToken";

export const runtime = "nodejs";

export async function GET() {
  const isAdmin = await verifyAdminToken();
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const q = query(collection(db, "cameras"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Get cameras error:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch cameras" }), { status: 500 });
  }
}
