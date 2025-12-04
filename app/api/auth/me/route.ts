import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function getToken(request: Request): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

export async function GET(request: Request) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    const payload: any = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, nickname: true },
    });

    return NextResponse.json({ authenticated: true, user });
  } catch (err) {
    console.error("ME ERROR", err);
    return NextResponse.json(
      { authenticated: false, user: null, error: String(err) },
      { status: 500 }
    );
  }
}
