"use client";

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-6">로그인</h1>
      <form className="flex flex-col w-80 gap-4 bg-white p-6 rounded-2xl shadow">
        <input
          type="email"
          placeholder="이메일"
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          로그인
        </button>
      </form>
    </main>
  );
}
