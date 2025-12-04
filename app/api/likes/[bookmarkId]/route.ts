import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function getTokenFromRequest(request: Request) {
  const cookie = request.headers.get("cookie");
  return cookie?.match(/token=([^;]+)/)?.[1] ?? null;
}

// ===========================
// POST /api/likes/:bookmarkId
//  - 좋아요 추가
// ===========================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookmarkId: string }> }
) {
  try {
    const { bookmarkId } = await params;
    const bookmarkIdNum = Number(bookmarkId);

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const tokenInfo = await verifyToken(token);

    // null-safe 체크
    if (!tokenInfo || !tokenInfo.userId) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const like = await prisma.like.create({
      data: {
        bookmarkId: bookmarkIdNum,
        // 🔹 userId를 문자열로 변환해서 Prisma 타입과 맞춤
        userId: String(tokenInfo.userId),
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

// ===========================
// DELETE /api/likes/:bookmarkId
//  - 좋아요 취소
// ===========================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookmarkId: string }> }
) {
  try {
    const { bookmarkId } = await params;
    const bookmarkIdNum = Number(bookmarkId);

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const tokenInfo = await verifyToken(token);
    if (!tokenInfo || !tokenInfo.userId) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    await prisma.like.deleteMany({
      where: {
        bookmarkId: bookmarkIdNum,
        userId: String(tokenInfo.userId),
      },
    });

    return NextResponse.json({ message: "좋아요 취소됨" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "서버 오류" }, { status: 500 });
  }
}

// ===========================
// GET /api/likes/:bookmarkId
//  - 좋아요 수 조회
// ===========================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookmarkId: string }> }
) {
  try {
    const { bookmarkId } = await params;
    const bookmarkIdNum = Number(bookmarkId);

    const likeCount = await prisma.like.count({
      where: { bookmarkId: bookmarkIdNum },
    });

    return NextResponse.json({ likeCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "서버 오류" }, { status: 500 });
  }
}
