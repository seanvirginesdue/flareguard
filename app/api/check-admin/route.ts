import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("authToken")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "No token" },
        { status: 401 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    if (decodedToken.admin) {
      return NextResponse.json({ success: true, admin: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Not admin" },
        { status: 403 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
