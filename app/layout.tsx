import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import { BookmarkProvider } from "../context/BookmarkContext";

export const metadata: Metadata = {
  title: "CineFeel",
  description: "북마크 기반 영화 추천 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="text-gray-900">
        <BookmarkProvider>
          <Header />
          <main className="max-w-5xl mx-auto p-4">{children}</main>
        </BookmarkProvider>
      </body>
    </html>
  );
}
