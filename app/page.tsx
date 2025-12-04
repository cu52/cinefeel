"use client";

import { useEffect, useState } from "react";
import MovieCard from "@/components/MovieCard";
import MovieDetailModal from "@/components/MovieDetailModal";
import { useMyBookmarks } from "@/hooks/useMyBookmarks";

type Movie = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  popularity: number;
  genre_ids?: number[];
};

type SortKey = "popular" | "latest" | "rating";

type GenreOption = {
  id: number;
  name: string;
};

// TMDB 주요 장르 목록
const GENRES: GenreOption[] = [
  { id: 28, name: "액션" },
  { id: 12, name: "모험" },
  { id: 16, name: "애니메이션" },
  { id: 35, name: "코미디" },
  { id: 80, name: "범죄" },
  { id: 18, name: "드라마" },
  { id: 14, name: "판타지" },
  { id: 27, name: "공포" },
  { id: 10749, name: "로맨스" },
  { id: 878, name: "SF" },
  { id: 53, name: "스릴러" },
  { id: 10752, name: "전쟁" },
];

const MAX_TMDB_PAGES = 500;

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("popular");
  const [selectedGenre, setSelectedGenre] = useState<number | "all">("all");

  // ⭐ 모달로 띄울 영화 ID (null = 모달 X)
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  // 로고 클릭 시 초기화 이벤트
  useEffect(() => {
    const handleReset = () => {
      setSortKey("popular");
      setSelectedGenre("all");
      setCurrentPage(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("cinefeel-home-reset", handleReset);
    return () =>
      window.removeEventListener("cinefeel-home-reset", handleReset);
  }, []);

  // 북마크 훅
  const { isLoggedIn, isBookmarked, toggleBookmark, actionLoadingId } =
    useMyBookmarks();

  // TMDB API 요청
  useEffect(() => {
    const fetchMovies = async () => {
      setLoadingMovies(true);
      setError(null);

      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        const lang = "ko-KR";

        if (!apiKey) {
          setError("TMDB API 키가 설정되어 있지 않습니다.");
          setLoadingMovies(false);
          return;
        }

        const page = Math.min(currentPage, MAX_TMDB_PAGES);

        let sortParam = "popularity.desc";
        switch (sortKey) {
          case "latest":
            sortParam = "primary_release_date.desc";
            break;
          case "rating":
            sortParam = "vote_average.desc";
            break;
          default:
            sortParam = "popularity.desc";
        }

        const baseUrl = new URL(
          "https://api.themoviedb.org/3/discover/movie"
        );
        baseUrl.searchParams.set("api_key", apiKey);
        baseUrl.searchParams.set("language", lang);
        baseUrl.searchParams.set("sort_by", sortParam);
        baseUrl.searchParams.set("page", String(page));
        baseUrl.searchParams.set("include_adult", "false");
        baseUrl.searchParams.set("include_video", "false");

        if (sortKey === "rating") {
          baseUrl.searchParams.set("vote_count.gte", "200");
        }

        if (selectedGenre !== "all") {
          baseUrl.searchParams.set("with_genres", String(selectedGenre));
        }

        const res = await fetch(baseUrl.toString());

        if (!res.ok) {
          setError(`TMDB 요청 실패: ${res.status} ${res.statusText}`);
          setLoadingMovies(false);
          return;
        }

        const data = await res.json();

        const pageMovies: Movie[] = (data.results || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          poster_path: m.poster_path ?? null,
          vote_average: m.vote_average ?? 0,
          release_date: m.release_date ?? "",
          popularity: m.popularity ?? 0,
          genre_ids: m.genre_ids ?? [],
        }));

        setMovies(pageMovies);

        const rawTotal = data.total_pages ?? null;
        setTotalPages(rawTotal ? Math.min(rawTotal, MAX_TMDB_PAGES) : null);
      } catch (err) {
        console.error("TMDB 불러오기 실패:", err);
        setError("영화 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoadingMovies(false);
      }
    };

    fetchMovies();
  }, [currentPage, sortKey, selectedGenre]);

  const goToPrevPage = () => {
    setCurrentPage((p) => (p > 1 ? p - 1 : p));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToNextPage = () => {
    setCurrentPage((p) => {
      const max = totalPages ?? MAX_TMDB_PAGES;
      return p < max ? p + 1 : p;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToInputPage = () => {
    const input = document.querySelector<HTMLInputElement>("#pageInput");
    if (!input) return;

    const n = Number(input.value);
    const max = totalPages ?? MAX_TMDB_PAGES;

    if (!isNaN(n) && n >= 1 && n <= max) {
      setCurrentPage(n);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      alert(`1 ~ ${max} 사이의 페이지 번호만 이동할 수 있습니다.`);
    }
  };

  if (loadingMovies && !movies.length) {
    return (
      <main className="flex flex-col items-center justify-center h-screen text-gray-500">
        <p>🎬 영화 목록을 불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen py-8">
      <h1 className="text-4xl font-bold mb-3 text-black">🎬 CineFeel</h1>
      <p className="text-gray-600 mb-2 text-center max-w-2xl">
        TMDB Discover를 기반으로, 인기순 / 최신 개봉순 / 평점순으로 영화를
        탐색해 보세요.
      </p>
      <p className="text-xs text-gray-400 mb-4">
        ※ TMDB 정책상 최대 {MAX_TMDB_PAGES} 페이지(약{" "}
        {MAX_TMDB_PAGES * 20}편)까지 조회 가능합니다.
      </p>

      {isLoggedIn === false && (
        <p className="mb-4 text-sm text-gray-500">
          북마크 기능은 로그인 후 사용할 수 있습니다.
        </p>
      )}

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {/* 정렬/장르 옵션 */}
      <section className="w-full max-w-6xl mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">정렬:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="popular">인기순</option>
            <option value="latest">최신 개봉순</option>
            <option value="rating">평점 높은 순</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">장르:</span>
          <select
            value={selectedGenre === "all" ? "all" : String(selectedGenre)}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedGenre(val === "all" ? "all" : parseInt(val, 10));
            }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">전체</option>
            {GENRES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* 영화 카드 리스트 */}
      <section className="max-w-6xl px-4 flex-1 w-full">
        {movies.length === 0 ? (
          <p className="text-sm text-gray-500">조건에 맞는 영화가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-6">
            {movies.map((movie) => {
              const bookmarked = isBookmarked(movie.id);
              const loading = actionLoadingId === movie.id;

              const releaseYear = movie.release_date
                ? movie.release_date.split("-")[0]
                : undefined;

              return (
                <MovieCard
                  key={movie.id}
                  title={movie.title}
                  detailHref={`/movie/${movie.id}`}
                  posterSrc={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "/no-image.png"
                  }
                  releaseYear={releaseYear}
                  voteAverage={movie.vote_average}
                  bookmarkState={{
                    isBookmarked: bookmarked,
                    loading,
                    onToggle: () =>
                      toggleBookmark({
                        id: movie.id,
                        title: movie.title,
                        poster_path: movie.poster_path || "",
                      }),
                  }}
                  // ⭐ 클릭 시 모달 오픈
                  onCardClick={() => setSelectedMovieId(movie.id)}
                />
              );
            })}
          </div>
        )}

        {/* 페이지네이션 */}
        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className={`px-3 py-1 rounded text-sm border ${
                currentPage <= 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              이전 페이지
            </button>

            <span className="text-sm text-gray-700">
              {totalPages ? `${currentPage} / ${totalPages}` : currentPage}
            </span>

            <button
              onClick={goToNextPage}
              disabled={
                !!totalPages && currentPage >= (totalPages ?? MAX_TMDB_PAGES)
              }
              className={`px-3 py-1 rounded text-sm border ${
                !!totalPages && currentPage >= (totalPages ?? MAX_TMDB_PAGES)
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              다음 페이지
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">페이지 이동:</span>
            <input
              id="pageInput"
              type="number"
              min={1}
              max={totalPages ?? MAX_TMDB_PAGES}
              placeholder="번호"
              className="border px-2 py-1 rounded w-20 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") goToInputPage();
              }}
            />

            <button
              onClick={goToInputPage}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
            >
              이동
            </button>
          </div>
        </div>
      </section>

      {/* ⭐ 영화 상세 모달 */}
      {selectedMovieId !== null && (
        <MovieDetailModal
          movieId={selectedMovieId}
          onClose={() => setSelectedMovieId(null)}
        />
      )}
    </main>
  );
}
