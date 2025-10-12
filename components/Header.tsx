"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setQuery("");
    }
  };

  return (
    <header className="w-full bg-white shadow-sm">
      <nav className="max-w-5xl mx-auto flex items-center justify-between p-4">
        {/* 왼쪽: 로고 */}
        <Link href="/" className="text-2xl font-bold text-blue-600">
          CineFeel
        </Link>

        {/* 오른쪽: 메뉴 + 검색창 */}
        <div className="flex gap-6 text-gray-700 items-center">
          <Link href="/">홈</Link>
          <Link href="/my">내 북마크</Link>
          <Link href="/login">로그인</Link>
          <Link href="/signup">회원가입</Link>

          {/* 🔍 검색창 추가 (이 부분이 새로 들어가는 코드) */}
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="영화 검색..."
              className="border rounded px-2 py-1 text-sm"
            />
          </form>
        </div>
      </nav>
    </header>
  );
}
