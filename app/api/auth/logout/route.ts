import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "logout ok" });

  res.headers.append(
    "Set-Cookie",
    `token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );

  return res;
}
