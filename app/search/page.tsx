"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MovieCard from "@/components/MovieCard";
import MovieDetailModal from "@/components/MovieDetailModal";
import { useMyBookmarks } from "@/hooks/useMyBookmarks";

type Movie = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  genre_ids?: number[];
};

type GenreOption = {
  id: number;
  name: string;
};

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

// 🔹 실제 검색 페이지 로직 / UI 전부 여기로 이동
function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const pageParam = searchParams.get("page") ?? "1";
  const currentPage = Math.max(parseInt(pageParam, 10) || 1, 1);

  const [searchInput, setSearchInput] = useState(q);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const [selectedGenre, setSelectedGenre] = useState<number | "all">("all");

  // ⭐ 모달용 선택된 영화 ID
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  // 북마크 훅
  const {
    isLoggedIn,
    isBookmarked,
    toggleBookmark,
    actionLoadingId,
  } = useMyBookmarks();

  // 검색 실행 (q, currentPage가 바뀔 때마다)
  useEffect(() => {
    const fetchSearch = async () => {
      if (!q.trim()) {
        setMovies([]);
        setTotalPages(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        const lang = "ko-KR";

        if (!apiKey) {
          setError("TMDB API 키가 설정되어 있지 않습니다.");
          setLoading(false);
          return;
        }

        const url = new URL("https://api.themoviedb.org/3/search/movie");
        url.searchParams.set("api_key", apiKey);
        url.searchParams.set("language", lang);
        url.searchParams.set("query", q);
        url.searchParams.set("page", String(currentPage));
        url.searchParams.set("include_adult", "false");

        const res = await fetch(url.toString());

        if (!res.ok) {
          setError(`TMDB 검색 요청 실패: ${res.status} ${res.statusText}`);
          setLoading(false);
          return;
        }

        const data = await res.json();

        const results: Movie[] = (data.results || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          poster_path: m.poster_path ?? null,
          vote_average: m.vote_average ?? 0,
          release_date: m.release_date ?? "",
          genre_ids: m.genre_ids ?? [],
        }));

        setMovies(results);
        setTotalPages(data.total_pages ?? null);
      } catch (err) {
        console.error("TMDB 검색 실패:", err);
        setError("검색 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSearch();
  }, [q, currentPage]);

  // 장르 필터 적용된 검색 결과
  const filteredMovies = useMemo(() => {
    if (selectedGenre === "all") return movies;
    return movies.filter((m) => m.genre_ids?.includes(selectedGenre));
  }, [movies, selectedGenre]);

  // 검색 폼 submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = searchInput.trim();

    if (!keyword) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(keyword)}&page=1`);
  };

  // 페이지 이동
  const movePage = (page: number) => {
    if (!q.trim()) return;
    const target = Math.max(page, 1);
    router.push(`/search?q=${encodeURIComponent(q)}&page=${target}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPrevPage = () => {
    if (currentPage > 1) movePage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (totalPages && currentPage < totalPages) movePage(currentPage + 1);
  };

  const goToInputPage = () => {
    const input = document.querySelector<HTMLInputElement>("#searchPageInput");
    if (!input) return;

    const n = Number(input.value);
    const max = totalPages ?? 1;

    if (!isNaN(n) && n >= 1 && n <= max) {
      movePage(n);
    } else {
      alert(`1 ~ ${max} 사이의 페이지 번호만 이동할 수 있습니다.`);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen py-8">
      <h1 className="text-3xl font-bold mb-3 text-black">🔎 영화 검색</h1>
      <p className="text-gray-600 mb-4 text-center max-w-2xl">
        TMDB 전체 영화 데이터베이스에서 제목으로 검색하고, 장르로 좁혀 볼 수 있습니다.
      </p>

      {/* 검색 입력 폼 */}
      <form
        onSubmit={handleSearchSubmit}
        className="w-full max-w-2xl px-4 mb-4 flex gap-2"
      >
        <input
          type="text"
          placeholder="영화 제목을 입력하세요..."
          className="flex-1 border px-4 py-2 rounded-md shadow-sm"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold"
        >
          검색
        </button>
      </form>

      {/* 장르 필터 */}
      <div className="w-full max-w-2xl px-4 mb-6 flex justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">장르:</span>
          <select
            value={selectedGenre === "all" ? "all" : String(selectedGenre)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "all") setSelectedGenre("all");
              else setSelectedGenre(parseInt(val, 10));
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
      </div>

      {isLoggedIn === false && (
        <p className="mb-4 text-sm text-gray-500">
          북마크 기능은 로그인 후 사용할 수 있습니다.
        </p>
      )}

      {/* 로딩 / 에러 / 안내 */}
      {loading && (
        <p className="text-sm text-gray-500 mb-4">검색 중입니다...</p>
      )}
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {!q.trim() && !loading && (
        <p className="text-sm text-gray-500 mb-4">
          검색어를 입력하고 검색 버튼을 눌러주세요.
        </p>
      )}

      {/* 검색 결과 */}
      <section className="max-w-6xl px-4 flex-1 w-full">
        {q.trim() && !loading && filteredMovies.length === 0 && (
          <p className="text-sm text-gray-500">
            "{q}"에 대한 검색 결과가 없습니다.
          </p>
        )}

        {filteredMovies.length > 0 && (
          <>
            <p className="text-sm text-gray-600 mb-3">
              "{q}" 검색 결과 (페이지 {currentPage}
              {totalPages ? ` / ${totalPages}` : ""})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-6">
              {filteredMovies.map((movie) => {
                const bookmarked = isBookmarked(movie.id);
                const loadingBookmark = actionLoadingId === movie.id;

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
                      loading: loadingBookmark,
                      onToggle: () =>
                        toggleBookmark({
                          id: movie.id,
                          title: movie.title,
                          poster_path: movie.poster_path || "",
                        }),
                    }}
                    // ⭐ 카드 클릭 시 모달 오픈
                    onCardClick={() => setSelectedMovieId(movie.id)}
                  />
                );
              })}
            </div>

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
                  disabled={!!totalPages && currentPage >= (totalPages ?? 1)}
                  className={`px-3 py-1 rounded text-sm border ${
                    !!totalPages && currentPage >= (totalPages ?? 1)
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  다음 페이지
                </button>
              </div>

              {/* 페이지 점프 */}
              {totalPages && totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">페이지 이동:</span>

                  <input
                    id="searchPageInput"
                    type="number"
                    min={1}
                    max={totalPages}
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
              )}
            </div>
          </>
        )}
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

// 🔹 Next 15 규칙: useSearchParams를 쓰는 컴포넌트는 Suspense로 감싸기
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-col items-center min-h-screen py-8">
          <p className="text-sm text-gray-500">검색 페이지를 불러오는 중...</p>
        </main>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
