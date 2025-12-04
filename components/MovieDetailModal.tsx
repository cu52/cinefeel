// components/MovieDetailModal.tsx
"use client";

import { useEffect, useState } from "react";
import MovieDetailClient from "@/app/movie/[id]/MovieDetailClient";

type MovieDetail = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  genres?: { id: number; name: string }[];
};

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const LANG = "ko-KR";

async function fetchMovieDetail(id: number): Promise<MovieDetail | null> {
  if (!API_KEY) {
    console.error("TMDB API 키가 설정되어 있지 않습니다.");
    return null;
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=${LANG}`
    );

    if (!res.ok) {
      console.error("TMDB 상세 요청 실패:", res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    return data as MovieDetail;
  } catch (err) {
    console.error("TMDB 상세 요청 에러:", err);
    return null;
  }
}

export default function MovieDetailModal({
  movieId,
  onClose,
}: {
  movieId: number;
  onClose: () => void;
}) {
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const data = await fetchMovieDetail(movieId);
      if (cancelled) return;

      if (!data) {
        setError("영화 정보를 불러오지 못했습니다.");
      } else {
        setMovie(data);
      }
      setLoading(false);
    };

    load();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    // body 스크롤 잠금
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [movieId, onClose]);

  // 공통 오버레이 레이아웃 (배경 클릭 → 닫기, 내용 영역 클릭은 유지)
  const Overlay = ({ children }: { children: React.ReactNode }) => (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Overlay>
        <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl text-center">
          영화 정보를 불러오는 중...
        </div>
      </Overlay>
    );
  }

  if (error || !movie) {
    return (
      <Overlay>
        <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl text-center">
          <p className="mb-3">{error ?? "영화 정보를 불러오지 못했습니다."}</p>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-sm"
          >
            닫기
          </button>
        </div>
      </Overlay>
    );
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/no-image.png";

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;

  const releaseYear = movie.release_date
    ? movie.release_date.split("-")[0]
    : undefined;

  return (
    <Overlay>
      {/* X 버튼 */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-50 text-white/80 hover:text-white text-2xl"
      >
        ✕
      </button>

      {/* 기존 상세페이지와 거의 동일한 레이아웃 (TMDB 링크 제거 버전) */}
      <main className="bg-slate-900 text-white rounded-2xl overflow-hidden">
        {/* 배경 이미지 영역 */}
        <section className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden">
          {backdropUrl ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40"
                style={{ backgroundImage: `url(${backdropUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-slate-800" />
          )}

          <div className="relative z-10 max-w-5xl mx-auto px-4 h-full flex items-end pb-6 gap-4">
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-32 md:w-40 lg:w-48 rounded-lg shadow-lg object-cover border border-slate-700"
            />
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
                {releaseYear && <span>{releaseYear}년</span>}
                {movie.runtime && <span>{movie.runtime}분</span>}
                <span>⭐ {movie.vote_average.toFixed(1)}</span>
                {movie.genres && movie.genres.length > 0 && (
                  <span>{movie.genres.map((g) => g.name).join(" / ")}</span>
                )}
              </div>

              {/* 상세 페이지 전용 북마크 버튼 그대로 사용 */}
              <div className="mt-3">
                <MovieDetailClient
                  movie={{
                    id: movie.id,
                    title: movie.title,
                    poster_path: movie.poster_path,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 상세 정보 */}
        <section className="max-w-5xl mx-auto px-4 mt-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 왼쪽: 포스터 (모바일 보강용) */}
          <div className="md:hidden">
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-40 rounded-lg shadow-lg object-cover border border-slate-700 mx-auto mb-4"
            />
          </div>

          {/* 오른쪽(또는 아래): 줄거리 */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-3">줄거리</h2>
            {movie.overview ? (
              <p className="text-sm md:text-base text-slate-100 leading-relaxed whitespace-pre-line">
                {movie.overview}
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                등록된 줄거리 정보가 없습니다.
              </p>
            )}
          </div>

          {/* 추가 정보 섹션 */}
          <div className="space-y-4 text-sm text-slate-200">
            <div>
              <h3 className="font-semibold mb-1">평점</h3>
              <p>⭐ {movie.vote_average.toFixed(1)} / 10</p>
            </div>
            {releaseYear && (
              <div>
                <h3 className="font-semibold mb-1">개봉일</h3>
                <p>{movie.release_date}</p>
              </div>
            )}
            {movie.genres && movie.genres.length > 0 && (
              <div>
                <h3 className="font-semibold mb-1">장르</h3>
                <p>{movie.genres.map((g) => g.name).join(", ")}</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </Overlay>
  );
}
