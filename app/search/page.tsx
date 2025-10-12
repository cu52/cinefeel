"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

type Movie = {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    const fetchSearch = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=ko-KR&query=${encodeURIComponent(
            query
          )}`
        );
        const data = await res.json();
        setMovies(data.results || []);
      } catch (err) {
        console.error("❌ 검색 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSearch();
  }, [query]);

  if (loading) return <p className="text-gray-500">검색 중입니다...</p>;
  if (!query) return <p className="text-gray-500">검색어를 입력해주세요.</p>;
  if (movies.length === 0)
    return <p className="text-gray-500">검색 결과가 없습니다.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl">
      {movies.map((movie) => (
        <Link
          key={movie.id}
          href={`/movie/${movie.id}`}
          className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-lg transition"
        >
          <img
            src={
              movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : "/no-image.png"
            }
            alt={movie.title}
            className="w-full h-72 object-cover"
          />
          <div className="p-4">
            <h2 className="text-lg font-semibold">{movie.title}</h2>
            <p className="text-gray-500 text-sm">
              {movie.release_date?.split("-")[0]}
            </p>
            <p className="text-yellow-500 font-semibold mt-1">
              ⭐ {movie.vote_average?.toFixed(1)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="flex flex-col items-center min-h-screen py-8">
      <h1 className="text-3xl font-bold mb-6">🔍 검색 결과</h1>
      {/* 👇 Suspense로 감싸기 */}
      <Suspense fallback={<p className="text-gray-500">로딩 중...</p>}>
        <SearchContent />
      </Suspense>
    </main>
  );
}
