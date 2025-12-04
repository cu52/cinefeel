// app/movie/[id]/page.tsx
import { notFound } from "next/navigation";
import MovieDetailClient from "./MovieDetailClient";

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

async function fetchMovieDetail(id: string): Promise<MovieDetail | null> {
  if (!API_KEY) {
    console.error("TMDB API 키가 설정되어 있지 않습니다.");
    return null;
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=${LANG}`,
      { next: { revalidate: 60 } }
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

export default async function MovieDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const movie = await fetchMovieDetail(id);

  if (!movie) {
    notFound();
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
    <main className="min-h-screen pb-12 bg-slate-900 text-white">
      {/* 배경 이미지 */}
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

            {/* 상세 페이지 북마크 버튼 */}
            <MovieDetailClient
              movie={{
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
              }}
            />
          </div>
        </div>
      </section>

      {/* 상세 정보 */}
      <section className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:hidden">
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-40 rounded-lg shadow-lg object-cover border border-slate-700 mx-auto mb-4"
          />
        </div>

        {/* 줄거리 */}
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

        {/* 추가 정보 */}
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
  );
}
