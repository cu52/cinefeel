import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function getTokenFromRequest(request: Request) {
  const cookie = request.headers.get("cookie");
  return cookie?.match(/token=([^;]+)/)?.[1] ?? null;
}

export async function POST(request: Request, { params }: any) {
  try {
    const bookmarkId = Number(params.bookmarkId);
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const tokenInfo = await verifyToken(token);

    // 🔥 TypeScript null-safe 체크
    if (!tokenInfo || !tokenInfo.userId) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const like = await prisma.like.create({
      data: {
        bookmarkId,
        userId: tokenInfo.userId,  // ← 이제 타입 오류 없음
      },
    });

    return NextResponse.json(like);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { message: "이미 좋아요 중입니다." },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json({ message: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: any) {
  try {
    const bookmarkId = Number(params.bookmarkId);

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const tokenInfo = await verifyToken(token);
    if (!tokenInfo || !tokenInfo.userId) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    await prisma.like.deleteMany({
      where: {
        bookmarkId,
        userId: tokenInfo.userId,
      },
    });

    return NextResponse.json({ message: "좋아요 취소됨" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "서버 오류" }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: any) {
  try {
    const bookmarkId = Number(params.bookmarkId);

    const likeCount = await prisma.like.count({
      where: { bookmarkId },
    });

    return NextResponse.json({ likeCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "서버 오류" }, { status: 500 });
  }
}
