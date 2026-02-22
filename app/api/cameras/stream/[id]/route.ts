import { NextResponse } from "next/server";

const FLASK_URL = process.env.FLASK_URL || "http://localhost:5000";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const response = await fetch(`${FLASK_URL}/video_feed/${id}`, {
      method: "GET",
      
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("[ERROR] Flask responded:", response.status, await response.text());
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch stream" }),
        { status: response.status }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", "multipart/x-mixed-replace; boundary=frame");
    return new NextResponse(response.body, { headers });
  } catch (err) {
    console.error("[ERROR] Cannot reach Flask:", err);
    return new NextResponse(
      JSON.stringify({ error: "Cannot connect to Flask backend" }),
      { status: 500 }
    );
  }
}
