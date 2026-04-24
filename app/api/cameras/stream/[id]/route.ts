import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/verifyAdminToken";

export const runtime = "nodejs";

const FLASK_URL = process.env.FLASK_URL || "http://localhost:5000";
const VALID_ID = /^[a-zA-Z0-9_-]+$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdminToken();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!id || !VALID_ID.test(id)) {
    return NextResponse.json({ error: "Invalid camera ID" }, { status: 400 });
  }

  try {
    const response = await fetch(`${FLASK_URL}/video_feed/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[stream] Flask responded:", response.status);
      return NextResponse.json({ error: "Failed to fetch stream" }, { status: response.status });
    }

    const headers = new Headers();
    headers.set("Content-Type", "multipart/x-mixed-replace; boundary=frame");
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    return new NextResponse(response.body, { headers });
  } catch (err) {
    console.error("[stream] Cannot reach Flask:", err);
    return NextResponse.json({ error: "Cannot connect to stream backend" }, { status: 503 });
  }
}
