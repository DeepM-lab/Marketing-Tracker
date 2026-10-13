import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Marketing Tracker - Theo dõi tiến độ bài đăng',
  description: 'Hệ thống báo cáo và theo dõi tiến độ bài đăng Marketing cho đội ngũ & quản lý',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-5 text-center text-xs text-slate-400">
          <p>© 2026 Marketing Tracker · DeepM Lab · Thiết kế tối ưu cho đội ngũ Marketing.</p>
        </footer>
      </body>
    </html>
  );
}
