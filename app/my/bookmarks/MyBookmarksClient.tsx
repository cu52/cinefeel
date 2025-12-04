// app/my/bookmarks/MyBookmarksClient.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Bookmark } from "./page";
import MovieCard from "@/components/MovieCard";
import MovieDetailModal from "@/components/MovieDetailModal";

interface Props {
  initialBookmarks: Bookmark[];
}

const TMDB_BASE = "https://image.tmdb.org/t/p/w500";

function getPosterSrc(path: string | null) {
  if (!path) return "/no-image.png";
  if (path.startsWith("http")) return path;
  return `${TMDB_BASE}${path}`;
}

type SortKey = "recent" | "old" | "title" | "likes";
type AutoSaveStatus = "idle" | "saving" | "saved";

export default function MyBookmarksClient({ initialBookmarks }: Props) {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // ⭐ 모달로 띄울 영화 ID (null = 모달 없음)
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  // 메모 입력값(초기값은 기존 note)
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>(() => {
    const entries = initialBookmarks.map((b) => [b.id, b.note ?? ""]);
    return Object.fromEntries(entries);
  });

  // 메모 자동 저장 상태
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    Record<number, AutoSaveStatus>
  >(() => {
    const entries = initialBookmarks.map((b) => [
      b.id,
      "idle" as AutoSaveStatus,
    ]);
    return Object.fromEntries(entries);
  });

  // 태그 입력값 (칩 입력창)
  const [tagInputs, setTagInputs] = useState<Record<number, string>>(() => {
    const entries = initialBookmarks.map((b) => [b.id, ""]);
    return Object.fromEntries(entries);
  });

  // 태그 저장 진행 중 표시용
  const [tagUpdatingId, setTagUpdatingId] = useState<number | null>(null);

  // 메모 자동 저장용 디바운스 타이머
  const autoSaveTimers = useRef<
    Record<number, ReturnType<typeof setTimeout> | undefined>
  >({});

  useEffect(() => {
    return () => {
      const timers = autoSaveTimers.current;
      Object.values(timers).forEach((t) => t && clearTimeout(t));
    };
  }, []);

  // 🔍 검색 / 필터 / 정렬 상태
  const [search, setSearch] = useState("");
  const [showOnlyPublic, setShowOnlyPublic] = useState(false);
  const [showOnlyWithMemo, setShowOnlyWithMemo] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [selectedTag, setSelectedTag] = useState<string | "all">("all");

  // 전체 사용 중인 태그 목록 (필터용)
  const allTags = useMemo(() => {
    const s = new Set<string>();
    bookmarks.forEach((b) => {
      b.tags?.forEach((t) => s.add(t));
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "ko"));
  }, [bookmarks]);

  // 공통 PATCH 함수 (메모 / 공개 / 태그 모두 이걸로)
  const patchBookmark = async (
    bookmark: Bookmark,
    changes: Partial<Pick<Bookmark, "note" | "isPublic" | "tags">>
  ) => {
    const prev = bookmarks;

    // 낙관적 업데이트
    setBookmarks((cur) =>
      cur.map((b) => (b.id === bookmark.id ? { ...b, ...changes } : b))
    );
    setUpdatingId(bookmark.id);

    try {
      const res = await fetch(`/api/bookmarks/${bookmark.tmdbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: changes.note,
          isPublic: changes.isPublic,
          tags: changes.tags,
        }),
      });

      if (res.status === 401) {
        alert(
          "세션이 만료되었거나 로그인 정보가 없습니다. 다시 로그인해 주세요."
        );
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setBookmarks(prev);
        alert("북마크 수정에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error(err);
      setBookmarks(prev);
      alert("수정 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setUpdatingId(null);
    }
  };

  // 🔄 메모 자동 저장용 onChange
  const handleNoteChange = (bookmark: Bookmark, value: string) => {
    // textarea 내용 반영
    setNoteDrafts((prev) => ({ ...prev, [bookmark.id]: value }));

    // 상태: 저장 예정
    setAutoSaveStatus((prev) => ({
      ...prev,
      [bookmark.id]: "saving",
    }));

    // 기존 타이머 있으면 취소
    const timers = autoSaveTimers.current;
    if (timers[bookmark.id]) {
      clearTimeout(timers[bookmark.id]);
    }

    // 새 타이머(디바운스 800ms)
    timers[bookmark.id] = setTimeout(async () => {
      await patchBookmark(bookmark, { note: value });

      // 저장 완료 상태
      setAutoSaveStatus((prev) => ({
        ...prev,
        [bookmark.id]: "saved",
      }));

      // 1.5초 뒤에 다시 idle로
      setTimeout(() => {
        setAutoSaveStatus((prev) => {
          if (prev[bookmark.id] !== "saved") return prev;
          return { ...prev, [bookmark.id]: "idle" };
        });
      }, 1500);
    }, 800);
  };

  // 공개/비공개 토글
  const handleTogglePublic = async (bookmark: Bookmark) => {
    await patchBookmark(bookmark, { isPublic: !bookmark.isPublic });
  };

  // 삭제
  const handleDelete = async (bookmark: Bookmark) => {
    const prev = bookmarks;
    setBookmarks(prev.filter((b) => b.id !== bookmark.id));
    setDeletingId(bookmark.id);

    try {
      const res = await fetch(`/api/bookmarks/${bookmark.tmdbId}`, {
        method: "DELETE",
      });

      if (res.status === 401) {
        alert("세션이 만료되었거나 로그인해야 합니다.");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setBookmarks(prev);
        alert("북마크 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error(err);
      setBookmarks(prev);
      alert("삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setDeletingId(null);
    }
  };

  // 🔖 태그 추가
  const handleAddTag = async (bookmark: Bookmark, rawTag: string) => {
    const trimmed = rawTag.trim().replace(/^#/, "");
    if (!trimmed) return;

    const currentTags = bookmark.tags ?? [];
    if (currentTags.includes(trimmed)) {
      // 중복이면 입력만 비우고 종료
      setTagInputs((prev) => ({ ...prev, [bookmark.id]: "" }));
      return;
    }

    const newTags = [...currentTags, trimmed];

    setTagUpdatingId(bookmark.id);
    await patchBookmark(bookmark, { tags: newTags });
    setTagInputs((prev) => ({ ...prev, [bookmark.id]: "" }));
    setTagUpdatingId(null);
  };

  // 🔖 태그 제거
  const handleRemoveTag = async (bookmark: Bookmark, tagToRemove: string) => {
    const currentTags = bookmark.tags ?? [];
    const newTags = currentTags.filter((t) => t !== tagToRemove);

    setTagUpdatingId(bookmark.id);
    await patchBookmark(bookmark, { tags: newTags });
    setTagUpdatingId(null);
  };

  // 🔎 검색 + 필터 + 정렬 적용된 리스트
  const displayedBookmarks = useMemo(() => {
    let list = [...bookmarks];

    // 검색 (제목 기준, 대소문자 무시)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => b.title.toLowerCase().includes(q));
    }

    // 공개만 보기
    if (showOnlyPublic) {
      list = list.filter((b) => b.isPublic);
    }

    // 메모 있는 북마크만
    if (showOnlyWithMemo) {
      list = list.filter((b) => (b.note ?? "").trim().length > 0);
    }

    // 태그 필터
    if (selectedTag !== "all") {
      list = list.filter((b) => b.tags?.includes(selectedTag as string));
    }

    // 정렬
    list.sort((a, b) => {
      switch (sortKey) {
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "old":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title, "ko");
        case "likes":
          return (b.likeCount ?? 0) - (a.likeCount ?? 0);
        default:
          return 0;
      }
    });

    return list;
  }, [
    bookmarks,
    search,
    showOnlyPublic,
    showOnlyWithMemo,
    sortKey,
    selectedTag,
  ]);

  if (bookmarks.length === 0) {
    return <p className="text-gray-500">현재 북마크한 영화가 없습니다.</p>;
  }

  return (
    <>
      {/* 🔧 상단 컨트롤 바 */}
      <div className="mb-6 flex flex-col gap-3">
        {/* 검색 입력: 상단 한 줄 전체, 공개 북마크와 비슷한 느낌으로 중앙 정렬 */}
        <div className="flex justify-center">
          <input
            type="text"
            placeholder="제목으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-3xl rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* 정렬 / 태그 / 토글: 아래 줄, 우측 정렬 */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* 정렬 선택 */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="recent">최신 추가순</option>
            <option value="old">오래된 순</option>
            <option value="title">제목순 (가나다)</option>
            <option value="likes">좋아요 많은 순</option>
          </select>

          {/* 태그 필터 */}
          <select
            value={selectedTag === "all" ? "all" : selectedTag}
            onChange={(e) =>
              setSelectedTag(
                e.target.value === "all" ? "all" : e.target.value
              )
            }
            className="rounded-md border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">태그 전체</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>

          {/* 공개만 보기 토글 */}
          <button
            type="button"
            onClick={() => setShowOnlyPublic((v) => !v)}
            className={`px-3 py-2 rounded-md text-sm font-semibold border ${
              showOnlyPublic
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-gray-100 text-gray-600 border-gray-300"
            }`}
          >
            {showOnlyPublic ? "공개만 보기 ON" : "공개만 보기 OFF"}
          </button>

          {/* 메모 있는 것만 보기 토글 */}
          <button
            type="button"
            onClick={() => setShowOnlyWithMemo((v) => !v)}
            className={`px-3 py-2 rounded-md text-sm font-semibold border ${
              showOnlyWithMemo
                ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                : "bg-gray-100 text-gray-600 border-gray-300"
            }`}
          >
            {showOnlyWithMemo ? "메모 있는 것만 보기" : "모든 북마크 보기"}
          </button>
        </div>
      </div>

      {/* 카드 리스트 */}
      {displayedBookmarks.length === 0 ? (
        <p className="text-sm text-gray-500">
          검색/필터 조건에 맞는 북마크가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {displayedBookmarks.map((b) => {
            const isUpdating = updatingId === b.id;
            const isDeleting = deletingId === b.id;
            const status = autoSaveStatus[b.id] ?? "idle";
            const tagInput = tagInputs[b.id] ?? "";
            const tags = b.tags ?? [];

            return (
              <MovieCard
                key={b.id}
                posterSrc={getPosterSrc(b.posterPath)}
                title={b.title}
                detailHref={`/movie/${b.tmdbId}`}
                tags={tags}
                likeCount={b.likeCount}
                memoState={{
                  value: noteDrafts[b.id] ?? "",
                  loading: isUpdating && status === "saving",
                  status,
                  onChange: (value: string) => handleNoteChange(b, value),
                }}
                tagEditState={{
                  tags,
                  inputValue: tagInput,
                  loading: tagUpdatingId === b.id,
                  onInputChange: (value: string) =>
                    setTagInputs((prev) => ({
                      ...prev,
                      [b.id]: value,
                    })),
                  onAddTag: (tag: string) => handleAddTag(b, tag),
                  onRemoveTag: (tag: string) => handleRemoveTag(b, tag),
                }}
                publicState={{
                  isPublic: b.isPublic,
                  loading: isUpdating,
                  onToggle: () => handleTogglePublic(b),
                }}
                deleteState={{
                  loading: isDeleting,
                  onDelete: () => handleDelete(b),
                }}
                // 카드 클릭 시 상세 모달 열기
                onCardClick={() => setSelectedMovieId(b.tmdbId)}
              />
            );
          })}
        </div>
      )}

      {/* 영화 상세 모달 */}
      {selectedMovieId !== null && (
        <MovieDetailModal
          movieId={selectedMovieId}
          onClose={() => setSelectedMovieId(null)}
        />
      )}
    </>
  );
}
