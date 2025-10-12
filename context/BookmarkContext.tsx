"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Movie = {
  id: number;
  title: string;
  year: number;
  image: string;
};

type BookmarkContextType = {
  bookmarks: Movie[];
  addBookmark: (movie: Movie) => void;
  removeBookmark: (id: number) => void;
};

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Movie[]>([]);

  // localStorage에서 북마크 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("cinefeel_bookmarks");
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  // 북마크 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("cinefeel_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const addBookmark = (movie: Movie) => {
    if (!bookmarks.find((m) => m.id === movie.id)) {
      setBookmarks([...bookmarks, movie]);
    }
  };

  const removeBookmark = (id: number) => {
    setBookmarks(bookmarks.filter((m) => m.id !== id));
  };

  return (
    <BookmarkContext.Provider value={{ bookmarks, addBookmark, removeBookmark }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error("useBookmarks must be used within a BookmarkProvider");
  }
  return context;
}
