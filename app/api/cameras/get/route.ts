import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export async function GET() {
  try {
    const q = query(collection(db, "cameras"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    console.error("Get cameras error:", err);
    return new Response("Failed to fetch cameras", { status: 500 });
  }
}
