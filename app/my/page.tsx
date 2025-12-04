"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Bookmark = {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  note: string | null;
  isPublic: boolean;
  createdAt: string;
  tags: string[];
  likeCount: number;
};

export default function MyBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 내 북마크 목록 처음 한 번만 불러오기
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/bookmarks", {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data?.message ?? "북마크를 불러올 수 없습니다.");
        } else {
          setBookmarks(data);
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

  // 🔥 북마크 삭제 후, 화면 상태도 즉시 갱신
  const handleDelete = async (tmdbId: number) => {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  try {
    const res = await fetch(`/api/bookmarks/${tmdbId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data?.message ?? "삭제에 실패했습니다.");
      return;
    }

    // ✅ 서버에서 삭제 성공했으니, 화면도 즉시 새로고침해서 반영
    window.location.reload();
  } catch (err) {
    console.error(err);
    alert("삭제 중 오류가 발생했습니다.");
  }
};


  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        내 북마크를 불러오는 중...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        {error}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">내 북마크</h1>

        {bookmarks.length === 0 ? (
          <p className="text-slate-300">아직 추가한 북마크가 없습니다.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="bg-slate-800 rounded-xl overflow-hidden shadow flex flex-col"
              >
                {/* 포스터 클릭 시 TMDB 상세로 이동 */}
                <Link href={`/movie/${b.tmdbId}`}>
                  {b.posterPath && (
                    <img
                      src={b.posterPath}
                      alt={b.title}
                      className="w-full h-64 object-cover"
                    />
                  )}
                </Link>

                <div className="p-4 flex flex-col flex-1">
                  {/* 제목 클릭 시 북마크 상세(메모/태그 수정) 페이지로 이동 */}
                  <Link href={`/bookmarks/${b.tmdbId}`}>
                    <h2 className="font-semibold mb-1 line-clamp-2">
                      {b.title}
                    </h2>
                  </Link>

                  {b.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 mb-2 text-xs text-slate-200">
                      {b.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-slate-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-slate-400 mb-2">
                    {new Date(b.createdAt).toLocaleDateString("ko-KR")}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-slate-400">
                      ❤️ {b.likeCount}
                    </span>
                    <button
                      onClick={() => handleDelete(b.tmdbId)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
