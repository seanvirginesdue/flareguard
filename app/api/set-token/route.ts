import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { token } = await req.json();

  const res = NextResponse.json({ success: true });

  res.cookies.set("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  return res;
}
