"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import MovieDetailModal from "@/components/MovieDetailModal";

type PublicBookmark = {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  note: string | null;
  createdAt: string;
  tags: string[];
  likeCount: number;
  likedUserIds?: number[];
  author: {
    id: string;
    nickname: string;
  };
};

type MeResponse = {
  authenticated: boolean;
  user: {
    id: number;
    email: string;
    nickname: string;
  } | null;
};

type SortKey = "recent" | "old" | "likes";

export default function ExplorePage() {
  const [bookmarks, setBookmarks] = useState<PublicBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 각 북마크별 좋아요 여부 (하트 색)
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  // 모달용 선택된 영화
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  // 🔍 검색/정렬/필터 상태
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [selectedTag, setSelectedTag] = useState<string | "all">("all");

  const router = useRouter();

  // 태그 목록 추출
  const allTags = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach((b) => {
      b.tags.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [bookmarks]);

  // -----------------------------
  // 현재 로그인한 사용자 + 공개 북마크 불러오기
  // -----------------------------
  useEffect(() => {
    const load = async () => {
      try {
        let myId: number | null = null;

        // 1) 현재 로그인한 유저 정보
        try {
          const meRes = await fetch("/api/auth/me", {
            credentials: "include",
          });
          if (meRes.ok) {
            const meData: MeResponse = await meRes.json();
            if (meData.authenticated && meData.user) {
              myId = meData.user.id;
            }
          }
        } catch {
          myId = null;
        }

        // 2) 공개 북마크 목록
        const res = await fetch("/api/public-bookmarks", {
          credentials: "include",
        });
        const data: PublicBookmark[] = await res.json();

        if (!res.ok) {
          setError((data as any)?.message ?? "공개 북마크를 불러올 수 없습니다.");
        } else {
          setBookmarks(data);

          // 3) 초기 liked 상태: likedUserIds 안에 myId가 있으면 true
          const initial: Record<number, boolean> = {};
          data.forEach((b) => {
            if (
              myId !== null &&
              Array.isArray(b.likedUserIds) &&
              b.likedUserIds.includes(myId)
            ) {
              initial[b.id] = true;
            } else {
              initial[b.id] = false;
            }
          });
          setLiked(initial);
        }
      } catch (err) {
        console.error(err);
        setError("알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // -----------------------------
  // 좋아요 토글
  // -----------------------------
  async function toggleLike(bookmarkId: number) {
    const isLiked = !!liked[bookmarkId];

    try {
      const res = await fetch(`/api/likes/${bookmarkId}`, {
        method: isLiked ? "DELETE" : "POST",
        credentials: "include",
      });

      // 인증 안 됨 → 로그인으로 보내기
      if (res.status === 401) {
        alert(
          "좋아요 기능을 사용하려면 로그인해야 합니다. 로그인 페이지로 이동합니다."
        );
        router.push("/login");
        return;
      }

      // ⚠️ 이미 좋아요인 상태에서 POST를 보낸 경우
      if (!isLiked && res.status === 400) {
        let body: any = null;
        try {
          body = await res.json();
        } catch {
          // ignore
        }
        const msg: string = body?.message ?? "";

        if (msg.includes("이미 좋아요 중입니다")) {
          setLiked((prev) => ({
            ...prev,
            [bookmarkId]: true,
          }));
          return;
        }
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("좋아요 처리 실패:", res.status, res.statusText, text);
        alert("좋아요 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      // 정상 처리된 경우: UI 업데이트 (하트 색 + 숫자)
      setLiked((prev) => ({
        ...prev,
        [bookmarkId]: !isLiked,
      }));

      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === bookmarkId
            ? {
                ...b,
                likeCount: b.likeCount + (isLiked ? -1 : 1),
              }
            : b
        )
      );
    } catch (err) {
      console.error(err);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  }

  // 🔍 검색/필터/정렬 적용된 리스트
  const displayedBookmarks = useMemo(() => {
    let list = [...bookmarks];

    // 제목 검색
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => b.title.toLowerCase().includes(q));
    }

    // 태그 필터
    if (selectedTag !== "all") {
      list = list.filter((b) => b.tags.includes(selectedTag as string));
    }

    // 정렬
    list.sort((a, b) => {
      switch (sortKey) {
        case "recent":
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
        case "old":
          return (
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
          );
        case "likes":
          return (b.likeCount ?? 0) - (a.likeCount ?? 0);
        default:
          return 0;
      }
    });

    return list;
  }, [bookmarks, search, selectedTag, sortKey]);

  // -----------------------------
  // UI 렌더링
  // -----------------------------
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-slate-900">
        공개 북마크를 불러오는 중...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-slate-900">
        <p>{error}</p>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 제목: 항상 중앙 정렬 */}
          <h1 className="text-2xl font-bold mb-6 text-center">
            공유 북마크
          </h1>

          {/* 상단 컨트롤 바 */}
          <div className="mb-6 flex flex-col gap-3">
            {/* 검색 입력: 내 북마크 페이지와 동일한 형태 (가운데 + max-w-3xl) */}
            <div className="flex justify-center">
              <input
                type="text"
                placeholder="제목으로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-3xl rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* 태그 / 정렬: 아래 줄, 우측 정렬 */}
            <div className="flex flex-wrap gap-2 items-center justify-end">
              {/* 태그 필터 */}
              {allTags.length > 0 && (
                <select
                  value={selectedTag === "all" ? "all" : selectedTag}
                  onChange={(e) =>
                    setSelectedTag(
                      e.target.value === "all" ? "all" : e.target.value
                    )
                  }
                  className="rounded-md border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="all">태그 전체</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      #{tag}
                    </option>
                  ))}
                </select>
              )}

              {/* 정렬 */}
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-md border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="recent">최신 등록순</option>
                <option value="old">오래된 순</option>
                <option value="likes">좋아요 많은 순</option>
              </select>
            </div>
          </div>

          {/* 카드 리스트 */}
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {displayedBookmarks.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 flex flex-col hover:shadow-md transition-shadow"
              >
                {b.posterPath && (
                  <button
                    type="button"
                    onClick={() => setSelectedMovieId(b.tmdbId)}
                    className="block"
                  >
                    <img
                      src={b.posterPath}
                      alt={b.title}
                      className="w-full h-64 object-cover"
                    />
                  </button>
                )}

                <div className="p-4 flex flex-col flex-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setSelectedMovieId(b.tmdbId)}
                    className="text-left"
                  >
                    <h2 className="font-semibold mb-1 line-clamp-2">
                      {b.title}
                    </h2>
                  </button>

                  <p className="text-xs text-gray-500 mb-2">
                    by {b.author.nickname}
                  </p>

                  {b.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2 text-xs text-gray-700">
                      {b.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-gray-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {b.note && (
                    <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                      {b.note}
                    </p>
                  )}

                  {/* ❤️ 좋아요 버튼 */}
                  <button
                    onClick={() => toggleLike(b.id)}
                    className="mt-auto text-lg self-end"
                  >
                    {liked[b.id] ? "❤️" : "🤍"} {b.likeCount}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 영화 상세 모달 */}
      {selectedMovieId !== null && (
        <MovieDetailModal
          movieId={selectedMovieId}
          onClose={() => setSelectedMovieId(null)}
        />
      )}
    </>
  );
}
