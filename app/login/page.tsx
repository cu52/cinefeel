// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message ?? "로그인에 실패했습니다.");
        setLoading(false);
        return;
      }

      // 로그인 성공 → 내 북마크 페이지로 이동
      router.push("/my/bookmarks");
    } catch (err) {
      console.error(err);
      setError("알 수 없는 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex justify-center items-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white shadow p-6 rounded-lg"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">로그인</h2>

        <label className="block mb-2 text-sm font-medium">이메일</label>
        <input
          type="email"
          className="w-full border px-3 py-2 rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block mb-2 text-sm font-medium">비밀번호</label>
        <input
          type="password"
          className="w-full border px-3 py-2 rounded mb-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-sm text-red-500 mb-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white font-semibold ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </main>
  );
}
