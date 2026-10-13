import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

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
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          <p>© 2026 Marketing Activity Tracker. Thiết kế tối ưu cho đội ngũ Marketing.</p>
        </footer>
      </body>
    </html>
  );
}
