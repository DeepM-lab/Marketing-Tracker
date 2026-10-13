'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types/database';
import { LogOut, PlusCircle, ListChecks, BarChart3, ShieldCheck, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
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
        console.error('Error fetching user:', err);
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

  // Đóng mobile menu khi chuyển trang
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isAdmin = profile?.role === 'admin';

  const navLinks = [
    { href: '/', label: 'Báo cáo bài đăng', icon: PlusCircle },
    { href: '/my-posts', label: 'Bài của tôi', icon: ListChecks },
    ...(isAdmin ? [{ href: '/admin', label: 'Dashboard', icon: BarChart3, admin: true }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* LOGO */}
        <div className="flex items-center gap-7">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-sm tracking-tight transition-transform group-hover:scale-95 shadow-sm">
              M
            </div>
            <span className="font-semibold text-slate-900 tracking-tight text-base">
              MktTracker
            </span>
          </Link>

          {/* NAV LINKS (Desktop) */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? link.admin
                          ? 'text-amber-950 font-semibold bg-amber-500/10'
                          : 'text-slate-900 font-semibold bg-slate-900/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${link.admin ? 'text-amber-600' : ''}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-slate-200/60" />
          ) : user ? (
            <>
              {/* User info (Desktop) */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-900 flex items-center justify-end gap-1.5">
                  {profile?.full_name || user.email?.split('@')[0]}
                  {isAdmin && (
                    <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      <ShieldCheck className="h-3.5 w-3.5" /> Admin
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-500 font-mono">{user.email}</span>
              </div>

              {/* Logout (Desktop) */}
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 shadow-2xs"
              >
                <LogOut className="h-4 w-4" />
                <span>Thoát</span>
              </button>

              {/* Hamburger (Mobile) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
                aria-label="Mở menu"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-slate-800 transition active:scale-95"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      <AnimatePresence>
        {mobileMenuOpen && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden border-t border-slate-200/80 bg-white overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {/* User info */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-bold">
                  {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                </div>
                {isAdmin && (
                  <span className="ml-auto shrink-0 inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </span>
                )}
              </div>

              {/* Nav links */}
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? link.admin
                          ? 'bg-amber-50 text-amber-900 font-semibold'
                          : 'bg-slate-900/5 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${link.admin ? 'text-amber-600' : 'text-slate-500'}`} />
                    {link.label}
                  </Link>
                );
              })}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition mt-1"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
