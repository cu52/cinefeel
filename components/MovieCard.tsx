"use client";

import Link from "next/link";

type BookmarkState = {
  isBookmarked: boolean;
  loading: boolean;
  onToggle: () => void;
};

type MemoState = {
  value: string;
  loading: boolean;
  status?: "idle" | "saving" | "saved"; // 🔹 자동 저장 상태
  onChange: (value: string) => void;
  onSave?: () => void; // 🔹 이제 선택적(optional) — 없어도 됨
};

type PublicState = {
  isPublic: boolean;
  loading: boolean;
  onToggle: () => void;
};

type DeleteState = {
  loading: boolean;
  onDelete: () => void;
};

type TagEditState = {
  tags: string[];
  inputValue: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
};

type MovieCardProps = {
  title: string;
  detailHref: string;
  posterSrc: string;
  releaseYear?: string;
  voteAverage?: number;

  // 메인/검색 페이지 쪽 북마크 버튼 용도
  bookmarkState?: BookmarkState;

  // 내 북마크 페이지 전용 정보들
  tags?: string[];
  likeCount?: number;
  memoState?: MemoState;
  publicState?: PublicState;
  deleteState?: DeleteState;
  tagEditState?: TagEditState;

  // 카드 클릭 시 실행할 콜백 (있으면 모달 등으로 사용)
  onCardClick?: () => void;
};

export default function MovieCard({
  title,
  detailHref,
  posterSrc,
  releaseYear,
  voteAverage,
  bookmarkState,
  tags,
  likeCount,
  memoState,
  publicState,
  deleteState,
  tagEditState,
  onCardClick,
}: MovieCardProps) {
  const showBookmarkControls =
    memoState || publicState || deleteState || tagEditState;

  const ImageWrapper = ({ children }: { children: React.ReactNode }) =>
    onCardClick ? (
      <button
        type="button"
        onClick={onCardClick}
        className="block w-full text-left"
      >
        {children}
      </button>
    ) : (
      <Link href={detailHref}>{children}</Link>
    );

  const TitleWrapper = ({ children }: { children: React.ReactNode }) =>
    onCardClick ? (
      <button
        type="button"
        onClick={onCardClick}
        className="w-full text-left"
      >
        {children}
      </button>
    ) : (
      <Link href={detailHref}>{children}</Link>
    );

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-lg transition relative">
      {/* 포스터 클릭 → 상세페이지 이동 or 모달 오픈 */}
      <ImageWrapper>
        <img
          src={posterSrc}
          alt={title}
          className="w-full h-72 object-cover"
        />
      </ImageWrapper>

      <div className="p-4 flex flex-col gap-2 text-sm">
        {/* 제목 / 기본 정보 */}
        <div>
          <TitleWrapper>
            <h2 className="text-lg font-semibold line-clamp-2">{title}</h2>
          </TitleWrapper>

          {releaseYear && (
            <p className="text-gray-500 text-xs mt-1">{releaseYear}</p>
          )}

          {typeof voteAverage === "number" && (
            <p className="text-yellow-500 font-semibold mt-1">
              ⭐ {voteAverage.toFixed(1)}
            </p>
          )}
        </div>

        {/* 태그 & 좋아요 (내 북마크에서 주로 사용) */}
        {(tags?.length || typeof likeCount === "number") && (
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {tags?.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-600"
              >
                #{tag}
              </span>
            ))}

            {typeof likeCount === "number" && (
              <span className="text-xs text-pink-600 font-semibold ml-auto">
                ❤️ {likeCount}
              </span>
            )}
          </div>
        )}

        {/* 메인/검색 페이지 북마크 버튼 (옵션) */}
        {bookmarkState && !showBookmarkControls && (
          <button
            onClick={bookmarkState.onToggle}
            disabled={bookmarkState.loading}
            className={`mt-2 w-full py-2 rounded text-white font-semibold transition ${
              bookmarkState.isBookmarked
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            } ${
              bookmarkState.loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {bookmarkState.loading
              ? "처리 중..."
              : bookmarkState.isBookmarked
              ? "북마크 제거"
              : "북마크에 추가"}
          </button>
        )}

        {/* 내 북마크 페이지용 컨트롤 영역 */}
        {showBookmarkControls && (
          <div className="mt-3 border-t pt-3 flex flex-col gap-3">
            {/* 메모 입력/자동 저장 상태 표시 */}
            {memoState && (
              <div className="flex flex-col gap-1">
                <textarea
                  value={memoState.value}
                  onChange={(e) => memoState.onChange(e.target.value)}
                  placeholder="메모를 입력하세요..."
                  className="w-full rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  rows={2}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    {memoState.status === "saving"
                      ? "자동 저장 중..."
                      : memoState.status === "saved"
                      ? "저장됨"
                      : ""}
                  </span>
                </div>
              </div>
            )}

            {/* 태그 편집(칩 입력) */}
            {tagEditState && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1">
                  {tagEditState.tags.length === 0 && (
                    <span className="text-[11px] text-gray-400">
                      태그 없음
                    </span>
                  )}
                  {tagEditState.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => tagEditState.onRemoveTag(tag)}
                      className="px-2 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-700 hover:bg-red-100 hover:text-red-700"
                    >
                      #{tag} ✕
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={tagEditState.inputValue}
                    onChange={(e) =>
                      tagEditState.onInputChange(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const v = tagEditState.inputValue.trim();
                        if (v) {
                          tagEditState.onAddTag(v);
                        }
                      }
                    }}
                    placeholder="태그 입력 후 Enter (예: 로맨스)"
                    className="flex-1 min-w-0 rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = tagEditState.inputValue.trim();
                      if (v) {
                        tagEditState.onAddTag(v);
                      }
                    }}
                    disabled={tagEditState.loading}
                    className="whitespace-nowrap px-3 py-1 rounded-md bg-gray-800 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    추가
                  </button>
                </div>
              </div>
            )}

            {/* 공개/비공개 토글 */}
            {publicState && (
              <button
                type="button"
                onClick={publicState.onToggle}
                disabled={publicState.loading}
                className={`rounded-md px-3 py-1 text-xs font-semibold border w-fit ${
                  publicState.isPublic
                    ? "bg-green-100 text-green-700 border-green-300"
                    : "bg-gray-100 text-gray-600 border-gray-300"
                } disabled:opacity-50`}
              >
                {publicState.isPublic ? "공개" : "비공개"}
              </button>
            )}

            {/* 삭제 버튼 */}
            {deleteState && (
              <button
                type="button"
                onClick={deleteState.onDelete}
                disabled={deleteState.loading}
                className="rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleteState.loading ? "삭제 중..." : "북마크 삭제"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
