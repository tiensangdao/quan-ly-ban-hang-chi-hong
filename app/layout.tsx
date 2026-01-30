import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "./components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quản lý bán hàng - Chị Hồng",
  description: "Hệ thống quản lý kho, nhập hàng, bán hàng thông minh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 pb-20`}
        suppressHydrationWarning
      >
        <main className="max-w-2xl mx-auto bg-white min-h-screen shadow-sm">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}