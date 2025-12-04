// app/api/public-bookmarks/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        likes: {
          select: {
            userId: true, // 좋아요 누른 유저 id만 가져옴
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const result = bookmarks.map((b: any) => ({
      id: b.id,
      tmdbId: b.tmdbId,
      title: b.title,
      posterPath: b.posterPath,
      note: b.note,
      isPublic: b.isPublic,
      createdAt: b.createdAt,
      tags: b.tags.map((bt: any) => bt.tag.name),
      likeCount: b.likes.length,
      likedUserIds: b.likes.map((l: any) => l.userId), // 🔹 여기 추가
      author: {
        id: b.user.id,
        nickname: b.user.nickname,
      },
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("GET /api/public-bookmarks error", error);
    return NextResponse.json(
      { message: "서버 오류", error: String(error) },
      { status: 500 }
    );
  }
}
