// app/api/bookmarks/[tmdbId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function getToken(request: Request): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

// 공통: userId + tmdbId로 내 북마크 하나 찾기
async function getUserAndBookmark(request: Request, tmdbIdParam: string) {
  const token = getToken(request);
  if (!token) {
    return {
      error: NextResponse.json(
        { message: "인증이 필요합니다." },
        { status: 401 }
      ),
    };
  }

  const payload: any = await verifyToken(token);
  if (!payload || !payload.userId) {
    return {
      error: NextResponse.json(
        { message: "인증이 필요합니다." },
        { status: 401 }
      ),
    };
  }

  const tmdbId = Number(tmdbIdParam);
  if (Number.isNaN(tmdbId)) {
    return {
      error: NextResponse.json(
        { message: "잘못된 tmdbId 입니다." },
        { status: 400 }
      ),
    };
  }

  const bookmark = await prisma.bookmark.findFirst({
    where: {
      userId: payload.userId,
      tmdbId,
    },
  });

  if (!bookmark) {
    return {
      error: NextResponse.json(
        { message: "북마크가 존재하지 않습니다." },
        { status: 404 }
      ),
    };
  }

  return { userId: payload.userId, tmdbId, bookmark };
}

// ===========================
// PATCH /api/bookmarks/:tmdbId
//  - 메모(note) / 공개여부(isPublic) / 태그(tags) 수정
// ===========================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tmdbId: string }> }
) {
  try {
    const { tmdbId } = await params;

    const ctx = await getUserAndBookmark(request, tmdbId);
    if ("error" in ctx) return ctx.error;

    const { bookmark } = ctx;
    const body = await request.json().catch(() => ({}));

    const {
      note,
      isPublic,
      tags,
    }: {
      note?: string;
      isPublic?: boolean;
      tags?: string[];
    } = body;

    // 태그 문자열 정리
    const normalizedTags = Array.isArray(tags)
      ? tags
          .map((t) => t.trim().replace(/^#/, ""))
          .filter((t) => t.length > 0)
      : undefined;

    // 트랜잭션: 북마크 기본 정보 + 태그 동시 업데이트
    const updated = await prisma.$transaction(async (tx) => {
      // 1) 기본 필드 업데이트
      const updatedBookmark = await tx.bookmark.update({
        where: { id: bookmark.id },
        data: {
          note: note !== undefined ? note : bookmark.note,
          isPublic:
            typeof isPublic === "boolean" ? isPublic : bookmark.isPublic,
        },
      });

      // 2) 태그가 넘어온 경우에만 태그 갱신
      if (normalizedTags) {
        // 기존 연결 모두 삭제
        await tx.bookmarkTag.deleteMany({
          where: { bookmarkId: bookmark.id },
        });

        if (normalizedTags.length > 0) {
          // Tag 테이블에 upsert 후, BookmarkTag 재생성
          const tagRecords = await Promise.all(
            normalizedTags.map((name) =>
              tx.tag.upsert({
                where: { name },
                create: { name },
                update: {},
              })
            )
          );

          await tx.bookmarkTag.createMany({
            data: tagRecords.map((tag) => ({
              bookmarkId: bookmark.id,
              tagId: tag.id,
            })),
          });
        }
      }

      return updatedBookmark;
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("BOOKMARK PATCH ERROR", err);
    return NextResponse.json(
      { message: "북마크 수정 중 서버 오류", error: String(err) },
      { status: 500 }
    );
  }
}

// ===========================
// DELETE /api/bookmarks/:tmdbId
//  - 북마크 삭제
// ===========================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tmdbId: string }> }
) {
  try {
    const { tmdbId } = await params;

    const ctx = await getUserAndBookmark(request, tmdbId);
    if ("error" in ctx) return ctx.error;

    const { bookmark } = ctx;

    await prisma.bookmark.delete({
      where: { id: bookmark.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("BOOKMARK DELETE ERROR", err);
    return NextResponse.json(
      { message: "북마크 삭제 중 서버 오류", error: String(err) },
      { status: 500 }
    );
  }
}
