import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return new Response("Missing RTSP URL", { status: 400 });

    const docRef = await addDoc(collection(db, "cameras"), {
      url,
      createdAt: serverTimestamp(),
    });

    return new Response(JSON.stringify({ id: docRef.id }), { status: 200 });
  } catch (err) {
    console.error("Add camera error:", err);
    return new Response("Failed to add camera", { status: 500 });
  }
}
