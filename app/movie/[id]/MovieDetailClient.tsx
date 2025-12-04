"use client";

import { useMyBookmarks } from "@/hooks/useMyBookmarks";
import { useRouter } from "next/navigation";

type MovieForClient = {
  id: number;
  title: string;
  poster_path: string | null;
};

export default function MovieDetailClient({ movie }: { movie: MovieForClient }) {
  const router = useRouter();

  const {
    isLoggedIn,
    isBookmarked,
    toggleBookmark,
    actionLoadingId,
  } = useMyBookmarks();

  const bookmarked = isBookmarked(movie.id);
  const loading = actionLoadingId === movie.id;

  const handleToggle = async () => {
    if (isLoggedIn === false) {
      alert("로그인이 필요한 기능입니다. 로그인 페이지로 이동합니다.");
      router.push("/login");
      return;
    }

    await toggleBookmark({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path ?? "",
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`mt-3 inline-flex items-center px-4 py-2 rounded text-sm font-semibold text-white transition
        ${bookmarked ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}
        ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
    >
      {loading
        ? "처리 중..."
        : bookmarked
        ? "북마크 제거"
        : "북마크에 추가"}
    </button>
  );
}
