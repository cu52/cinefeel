"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useBookmarks } from "../../../context/BookmarkContext";

type MovieDetail = {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
};

export default function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { addBookmark, removeBookmark, bookmarks } = useBookmarks();

  const isBookmarked = bookmarks.some((m) => m.id === Number(id));

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=ko-KR`
        );
        const data = await res.json();
        setMovie(data);
      } catch (error) {
        console.error("❌ 영화 상세 불러오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <main className="flex items-center justify-center h-screen text-gray-500">
        영화 정보를 불러오는 중입니다...
      </main>
    );
  }

  if (!movie) {
    return (
      <main className="flex flex-col items-center justify-center h-screen text-gray-600">
        <h1 className="text-2xl font-bold mb-4">영화를 찾을 수 없습니다 😢</h1>
        <a href="/" className="text-blue-500 hover:underline">
          홈으로 돌아가기
        </a>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen py-12">
      <div className="max-w-3xl bg-white rounded-2xl shadow p-8 flex flex-col md:flex-row gap-8">
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          className="w-full md:w-1/2 rounded-xl"
        />
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
            <p className="text-gray-500 mb-4">
              {movie.release_date?.split("-")[0]}
            </p>
            <p className="text-yellow-500 font-semibold mb-4">
              ⭐ 평점: {movie.vote_average?.toFixed(1)}
            </p>
            <p className="text-gray-700 leading-relaxed">{movie.overview}</p>
          </div>
          <button
            onClick={() =>
              isBookmarked
                ? removeBookmark(movie.id)
                : addBookmark({
                    id: movie.id,
                    title: movie.title,
                    year: Number(movie.release_date?.split("-")[0]),
                    image: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                  })
            }
            className={`mt-6 px-4 py-2 rounded text-white ${
              isBookmarked
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isBookmarked ? "북마크 제거" : "북마크에 추가"}
          </button>
        </div>
      </div>
    </main>
  );
}
