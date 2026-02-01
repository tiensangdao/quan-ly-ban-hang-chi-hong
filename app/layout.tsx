import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "./components/BottomNav";
import ZoomControl from "./components/ZoomControl";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background pb-20 text-foreground`}
        suppressHydrationWarning
      >
        <main className="max-w-2xl mx-auto bg-background min-h-screen shadow-sm">
          {children}
        </main>
        <ZoomControl />
        <BottomNav />
      </body>
    </html>
  );
}
