"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BookmarkDetailPage() {
  const { id } = useParams(); // tmdbId
  const router = useRouter();

  const [bookmark, setBookmark] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 편집 상태
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  // ------------------------------
  // 1) 북마크 상세 불러오기
  // ------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/bookmarks/${id}`);

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        setBookmark(data);

        setNote(data.note || "");
        setTags(data.tags?.join(", ") || "");
        setIsPublic(data.isPublic);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, router]);

  async function saveChanges() {
    try {
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
          isPublic,
        }),
      });

      if (!res.ok) {
        alert("수정에 실패했습니다.");
        return;
      }

      alert("수정되었습니다!");
    } catch (err) {
      console.error(err);
      alert("오류 발생");
    }
  }

  async function deleteBookmark() {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("삭제 실패");
        return;
      }

      alert("북마크가 삭제되었습니다.");
      router.push("/my/bookmarks");
    } catch (err) {
      console.error(err);
      alert("오류 발생");
    }
  }

  // ------------------------------
  // 2) UI 렌더링
  // ------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        로딩 중...
      </div>
    );
  }

  if (!bookmark) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        북마크를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-slate-800 p-6 rounded-xl shadow">

        {/* 제목 */}
        <h1 className="text-2xl font-bold mb-4">{bookmark.title}</h1>

        {/* 포스터 */}
        {bookmark.posterPath && (
          <img
            src={bookmark.posterPath}
            alt={bookmark.title}
            className="w-64 rounded-lg mb-6"
          />
        )}

        {/* 메모 */}
        <div className="mb-6">
          <label className="block text-sm mb-2">메모</label>
          <textarea
            className="w-full h-32 p-2 rounded bg-slate-700 text-white"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* 태그 */}
        <div className="mb-6">
          <label className="block text-sm mb-2">태그 (쉼표로 구분)</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-slate-700 text-white"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        {/* 공개 여부 */}
        <div className="mb-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            공개 북마크로 표시
          </label>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={saveChanges}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            저장
          </button>

          <button
            onClick={deleteBookmark}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
          >
            삭제
          </button>

          <button
            onClick={() => router.push("/my/bookmarks")}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded text-white"
          >
            목록으로
          </button>
        </div>
      </div>
    </div>
  );
}
