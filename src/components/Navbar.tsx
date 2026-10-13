'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types/database';
import { LogOut, PlusCircle, ListChecks, BarChart3, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          if (data) setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        if (data) setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isAdmin = profile?.role === 'admin' || user?.email === 'deepmlab12@gmail.com';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-indigo-600 tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              M
            </span>
            <span>MktTracker</span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  pathname === '/'
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                Báo cáo bài đăng
              </Link>
              <Link
                href="/my-posts"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  pathname === '/my-posts'
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ListChecks className="h-4 w-4" />
                Bài của tôi
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                    pathname === '/admin'
                      ? 'bg-amber-50 text-amber-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 text-amber-600" />
                  Dashboard của Sếp
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-slate-100" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 flex items-center justify-end gap-1">
                  {profile?.full_name || user.email?.split('@')[0]}
                  {isAdmin && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-medium text-amber-800">
                      <ShieldCheck className="h-3 w-3" /> Admin
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-500">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
