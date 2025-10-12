"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Movie = {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
};

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=ko-KR&page=1`
        );
        const data = await res.json();
        setMovies(data.results);
      } catch (err) {
        console.error("TMDB 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center h-screen text-gray-500">
        <p>🎬 영화 목록을 불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen py-8">
      <h1 className="text-4xl font-bold mb-8 text-blue-600">🎬 CineFeel</h1>
      <p className="text-gray-600 mb-12 text-center max-w-2xl">
        지금 인기 있는 영화를 확인해보세요!
      </p>

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
                ⭐ {movie.vote_average.toFixed(1)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
