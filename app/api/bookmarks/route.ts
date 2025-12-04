// app/api/bookmarks/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 쿠키에서 token 추출
function getToken(request: Request): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

// =====================================
// 1) 내 북마크 전체 조회 (GET /api/bookmarks)
// =====================================
export async function GET(request: Request) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { message: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const payload: any = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { message: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: payload.userId },
      include: {
        tags: { include: { tag: true } },
        likes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 프론트에서 먹기 쉬운 구조로 변환
    const result = bookmarks.map((b: any) => ({
      id: b.id,
      tmdbId: b.tmdbId,
      title: b.title,
      posterPath: b.posterPath,
      note: b.note,
      isPublic: b.isPublic,
      createdAt: b.createdAt,
      tags: (b.tags || []).map((bt: any) => bt.tag.name),
      likeCount: (b.likes || []).length,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("BOOKMARK LIST ERROR", err);
    return NextResponse.json(
      { message: "서버 오류", error: String(err) },
      { status: 500 }
    );
  }
}

// =====================================
// 2) 북마크 추가 (POST /api/bookmarks)
// =====================================
export async function POST(request: Request) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { message: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const payload: any = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { message: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tmdbId, title, posterPath } = body; // ⬅️ 프론트와 동일한 필드명으로 수정함

    if (!tmdbId || !title) {
      return NextResponse.json(
        { message: "tmdbId와 title은 필수입니다." },
        { status: 400 }
      );
    }

    // 이미 북마크되어 있다면 그대로 리턴
    const existing = await prisma.bookmark.findFirst({
      where: {
        tmdbId,
        userId: payload.userId,
      },
    });

    if (existing) return NextResponse.json(existing, { status: 200 });

    const created = await prisma.bookmark.create({
      data: {
        tmdbId,
        title,
        // ⬇️ 포스터 full URL 그대로 저장
        posterPath: posterPath ?? null,
        note: null,
        isPublic: false,
        user: { connect: { id: payload.userId } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("BOOKMARK CREATE ERROR", err);
    return NextResponse.json(
      { message: "북마크 생성 중 서버 오류", error: String(err) },
      { status: 500 }
    );
  }
}
