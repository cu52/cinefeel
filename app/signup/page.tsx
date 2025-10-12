"use client";

import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    // 실제 회원가입 API는 나중에 연동 예정
    alert(`회원가입 성공!\n이메일: ${email}`);
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-6">회원가입</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-80 gap-4 bg-white p-6 rounded-2xl shadow"
      >
        <input
          type="email"
          placeholder="이메일"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호 확인"
          className="border p-2 rounded"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          회원가입
        </button>
      </form>
    </main>
  );
}
