"use client";

import { useBookmarks } from "../../context/BookmarkContext";

export default function MyPage() {
  const { bookmarks, removeBookmark } = useBookmarks();

  return (
    <main className="flex flex-col items-center min-h-screen py-8">
      <h1 className="text-3xl font-bold mb-8">내 북마크</h1>
      {bookmarks.length === 0 ? (
        <p className="text-gray-500">아직 북마크한 영화가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl">
          {bookmarks.map((movie) => (
            <div
              key={movie.id}
              className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition"
            >
              <img src={movie.image} alt={movie.title} className="w-full" />
              <div className="p-4">
                <h2 className="text-xl font-semibold">{movie.title}</h2>
                <p className="text-gray-500 text-sm">{movie.year}</p>
                <button
                  onClick={() => removeBookmark(movie.id)}
                  className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                >
                  제거
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
