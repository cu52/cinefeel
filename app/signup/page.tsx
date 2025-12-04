"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password || !nickname) {
      alert("모든 필드를 입력해 주세요.");
      return;
    }
    if (password !== passwordCheck) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "회원가입 실패");
        setLoading(false);
        return;
      }

      alert("회원가입이 완료되었습니다!");
      router.push("/login");
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex justify-center items-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white shadow p-6 rounded-lg"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">회원가입</h2>

        <label className="block mb-2 text-sm font-medium">이메일</label>
        <input
          type="email"
          className="w-full border px-3 py-2 rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block mb-2 text-sm font-medium">닉네임</label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded mb-4"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <label className="block mb-2 text-sm font-medium">비밀번호</label>
        <input
          type="password"
          className="w-full border px-3 py-2 rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="block mb-2 text-sm font-medium">비밀번호 확인</label>
        <input
          type="password"
          className="w-full border px-3 py-2 rounded mb-4"
          value={passwordCheck}
          onChange={(e) => setPasswordCheck(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white font-semibold ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "처리 중..." : "회원가입"}
        </button>
      </form>
    </main>
  );
}
