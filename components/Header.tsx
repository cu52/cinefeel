"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";

type MeResponse = {
  authenticated: boolean;
  user: {
    id: number;
    email: string;
    nickname: string;
  } | null;
};

export default function Header() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          setMe({ authenticated: false, user: null });
        } else {
          setMe(data);
        }
      } catch {
        setMe({ authenticated: false, user: null });
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/";
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 로고 클릭 시 동작
  const handleLogoClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      // 이미 홈에 있는 경우: 네비게이션 막고, 홈 초기화 이벤트만 발행
      e.preventDefault();
      window.dispatchEvent(new Event("cinefeel-home-reset"));
    }
    // 다른 페이지일 때는 Link 기본 동작으로 / 로 이동
  };

  return (
    <header className="w-full bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
      <Link
        href="/"
        onClick={handleLogoClick}
        className="text-xl font-bold flex items-center gap-1 cursor-pointer"
      >
        🎬 CineFeel
      </Link>

      <nav className="flex items-center gap-4">
        <Link href="/explore" className="text-sm hover:underline">
          공유 북마크
        </Link>
        <Link href="/my/bookmarks" className="text-sm hover:underline">
          내 북마크
        </Link>
        <Link href="/search" className="text-sm hover:underline">
          검색
        </Link>

        {loading ? (
          <span className="text-sm text-slate-300">...</span>
        ) : me?.authenticated && me.user ? (
          <>
            <span className="text-sm text-slate-300">
              {me.user.nickname}님
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-sm"
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-sm"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-sm"
            >
              회원가입
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
