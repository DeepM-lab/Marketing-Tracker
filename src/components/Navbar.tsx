'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types/database';
import { LogOut, PlusCircle, ListChecks, BarChart3, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

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

  const navLinks = [
    { href: '/', label: 'Báo cáo bài đăng', icon: PlusCircle },
    { href: '/my-posts', label: 'Bài của tôi', icon: ListChecks },
    ...(isAdmin ? [{ href: '/admin', label: 'Dashboard Sếp', icon: BarChart3, admin: true }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-7">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-sm tracking-tight transition-transform group-hover:scale-95 shadow-sm">
              M
            </div>
            <span className="font-semibold text-slate-900 tracking-tight text-base">
              MktTracker
            </span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? link.admin
                          ? 'text-amber-950 font-semibold bg-amber-500/10'
                          : 'text-slate-900 font-semibold bg-slate-900/5'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${link.admin ? 'text-amber-600' : ''}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-7 w-20 animate-pulse rounded-md bg-slate-200/60" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-900 flex items-center justify-end gap-1.5">
                  {profile?.full_name || user.email?.split('@')[0]}
                  {isAdmin && (
                    <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      <ShieldCheck className="h-3 w-3" /> Admin
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 shadow-2xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Thoát</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-slate-800 transition active:scale-95"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
