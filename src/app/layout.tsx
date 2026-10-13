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
  title: 'DeepM Marketing - Hệ thống theo dõi bài đăng',
  description: 'Hệ thống báo cáo và quản lý tiến độ bài đăng Marketing cho DeepM',
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable}>
      <head>
        <link rel="icon" href="/logo.jpg" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-5 text-center text-xs text-slate-500">
          <p>© 2026 DeepM · Hệ thống Quản trị & Báo cáo Marketing · DeepM.vn</p>
        </footer>
      </body>
    </html>
  );
}
