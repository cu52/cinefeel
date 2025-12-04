// app/my/bookmarks/page.tsx
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import MyBookmarksClient from "./MyBookmarksClient";

export type Bookmark = {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  note: string | null;
  isPublic: boolean;
  createdAt: string;
  tags: string[];
  likeCount: number;
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  if (!host) throw new Error("호스트 정보를 가져오지 못했습니다.");
  return `${protocol}://${host}`;
}

export default async function MyBookmarksPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const baseUrl = await getBaseUrl();
  const h = await headers();
  const cookieHeader = h.get("cookie") ?? "";

  const res = await fetch(`${baseUrl}/api/bookmarks`, {
    method: "GET",
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[/api/bookmarks] 응답 실패", res.status, res.statusText, text);

    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold text-center text-slate-900">
          내 북마크
        </h1>
        <p className="text-red-500">
          북마크 데이터를 불러오지 못했습니다. (status {res.status}{" "}
          {res.statusText})
        </p>
        {text && (
          <pre className="mt-2 rounded bg-gray-100 p-2 text-xs whitespace-pre-wrap">
            {text}
          </pre>
        )}
      </main>
    );
  }

  const bookmarks: Bookmark[] = await res.json();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* 🔥 공개 북마크 페이지와 동일한 제목 스타일 */}
      <h1 className="mb-8 text-2xl font-bold text-center text-slate-900">
        내 북마크
      </h1>

      <MyBookmarksClient initialBookmarks={bookmarks} />
    </main>
  );
}
