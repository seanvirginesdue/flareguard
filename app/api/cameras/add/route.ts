import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp, getDocs, query } from "firebase/firestore";
import { verifyAdminToken } from "@/lib/verifyAdminToken";

export const runtime = "nodejs";

const MAX_CAMERAS = 4;
const RTSP_PATTERN = /^rtsp:\/\/.+/i;
const LAT_RANGE = { min: -90, max: 90 };
const LNG_RANGE = { min: -180, max: 180 };

export async function POST(req: Request) {
  const isAdmin = await verifyAdminToken();
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await req.json();
    const { url, latitude, longitude } = body;

    if (!url || typeof url !== "string" || !RTSP_PATTERN.test(url.trim())) {
      return new Response(JSON.stringify({ error: "Invalid RTSP URL" }), { status: 400 });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < LAT_RANGE.min || lat > LAT_RANGE.max) {
      return new Response(JSON.stringify({ error: "Latitude must be between -90 and 90" }), { status: 400 });
    }
    if (isNaN(lng) || lng < LNG_RANGE.min || lng > LNG_RANGE.max) {
      return new Response(JSON.stringify({ error: "Longitude must be between -180 and 180" }), { status: 400 });
    }

    const existing = await getDocs(query(collection(db, "cameras")));
    if (existing.size >= MAX_CAMERAS) {
      return new Response(JSON.stringify({ error: `Maximum ${MAX_CAMERAS} cameras allowed` }), { status: 400 });
    }

    const docRef = await addDoc(collection(db, "cameras"), {
      url: url.trim(),
      latitude: String(lat),
      longitude: String(lng),
      createdAt: serverTimestamp(),
    });

    return new Response(JSON.stringify({ id: docRef.id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Add camera error:", err);
    return new Response(JSON.stringify({ error: "Failed to add camera" }), { status: 500 });
  }
}
