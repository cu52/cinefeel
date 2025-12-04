// hooks/useMyBookmarks.ts
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type BasicMovie = {
  id: number;
  title: string;
  poster_path: string;
};

export function useMyBookmarks() {
  const router = useRouter();

  // 내 북마크(tmdbId 목록)
  const [bookmarkIds, setBookmarkIds] = useState<number[]>([]);
  // 로그인 여부 (null: 아직 모름)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  // 북마크 추가/삭제 액션 로딩 중인 영화 id
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  // 북마크 목록 로딩 여부
  const [loading, setLoading] = useState<boolean>(true);

  // -------------------------
  // 1) 내 북마크 목록 불러오기
  // -------------------------
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const res = await fetch("/api/bookmarks");

        if (res.status === 401) {
          setIsLoggedIn(false);
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          setBookmarkIds(data.map((b: any) => b.tmdbId));
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error("북마크 목록 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  const isBookmarked = (tmdbId: number) => bookmarkIds.includes(tmdbId);

  // -------------------------
  // 2) 북마크 추가 / 제거
  // -------------------------
  const toggleBookmark = async (movie: BasicMovie) => {
    try {
      setActionLoadingId(movie.id);

      // 이미 북마크 되어있으면 삭제
      if (isBookmarked(movie.id)) {
        const res = await fetch(`/api/bookmarks/${movie.id}`, {
          method: "DELETE",
        });

        if (res.status === 401) {
          alert("로그인이 필요한 기능입니다. 로그인 페이지로 이동합니다.");
          router.push("/login");
          return;
        }

        if (!res.ok) {
          alert("북마크 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
          return;
        }

        setBookmarkIds((prev) => prev.filter((id) => id !== movie.id));
        return;
      }

      // 새로 북마크 추가
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: movie.id,
          title: movie.title,
          posterPath: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          note: "",
          isPublic: true,
          tags: [],
        }),
      });

      if (res.status === 401) {
        alert("로그인이 필요한 기능입니다. 로그인 페이지로 이동합니다.");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        alert("북마크 추가에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      setBookmarkIds((prev) => [...prev, movie.id]);
      setIsLoggedIn(true);
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return {
    bookmarkIds,
    isLoggedIn,
    isBookmarked,
    toggleBookmark,
    loading,
    actionLoadingId,
  };
}
