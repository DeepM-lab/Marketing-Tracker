'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types/database';
import {
    LogOut,
    PlusCircle,
    ListChecks,
    BarChart3,
    ShieldCheck,
    Menu,
    X,
    KeyRound,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    User as UserIcon,
    ChevronDown,
    Mail,
    Shield,
    Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateSupabaseError } from '@/lib/utils/errorMessages';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // User Dropdown State (Hover & Click)
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // State cho Modal xem hồ sơ
    const [showProfileModal, setShowProfileModal] = useState(false);

    // State cho Modal đổi mật khẩu
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

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

    // Đóng mobile menu & dropdown khi chuyển trang (theo chuẩn React Docs: adjusting state during render để tránh cascading renders)
    const [prevPathname, setPrevPathname] = useState(pathname);
    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        setMobileMenuOpen(false);
        setDropdownOpen(false);
    }

    const handleMouseEnter = () => {
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
        }
        setDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setDropdownOpen(false);
        }, 200);
    };

    const handleLogout = async () => {
        setDropdownOpen(false);
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (!oldPassword.trim()) {
            setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }
        if (newPassword === oldPassword) {
            setPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setPasswordError('Mật khẩu xác nhận không trùng khớp.');
            return;
        }

        setPasswordLoading(true);
        try {
            if (!user?.email)
                throw new Error('Không tìm thấy thông tin tài khoản.');

            // 1. Xác thực mật khẩu cũ bằng cách thử signIn
            const { error: signInError } =
                await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: oldPassword,
                });

            if (signInError) {
                throw new Error(
                    'Mật khẩu cũ không chính xác. Vui lòng kiểm tra lại!',
                );
            }

            // 2. Cập nhật sang mật khẩu mới
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (updateError) throw updateError;

            setPasswordSuccess(
                'Đổi mật khẩu thành công! Mật khẩu mới đã có hiệu lực.',
            );
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess('');
            }, 1500);
        } catch (err: unknown) {
            const error = err as Error;
            setPasswordError(
                translateSupabaseError(error.message) ||
                    'Không thể đổi mật khẩu.',
            );
        } finally {
            setPasswordLoading(false);
        }
    };

    const isAdmin = profile?.role === 'admin';

    const navLinks = [
        { href: '/', label: 'Báo cáo bài đăng', icon: PlusCircle },
        { href: '/my-posts', label: 'Bài của tôi', icon: ListChecks },
        ...(isAdmin
            ? [
                  {
                      href: '/admin',
                      label: 'Quản trị',
                      icon: BarChart3,
                      admin: true,
                  },
              ]
            : []),
    ];

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-all">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
                    {/* LOGO DEEPM */}
                    <div className="flex items-center gap-7">
                        <Link
                            href="/"
                            className="group flex items-center gap-3"
                        >
                            <Image
                                width={44}
                                height={44}
                                src="/logo.png"
                                alt="DeepM Logo"
                                className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg object-contain group-hover:scale-95 transition-transform"
                            />
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg leading-tight">
                                    DeepM
                                </span>
                                <span className="text-xs text-slate-400 font-medium leading-none">
                                    Marketing Tracker
                                </span>
                            </div>
                        </Link>

                        {/* NAV LINKS (Desktop) */}
                        {user && (
                            <nav className="hidden md:flex items-center gap-1">
                                {navLinks.map((link) => {
                                    const Icon = link.icon;
                                    const isActive =
                                        link.href === '/admin'
                                            ? pathname.startsWith('/admin')
                                            : pathname === link.href;
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
                                            <Icon
                                                className={`h-4 w-4 ${link.admin ? 'text-amber-600' : ''}`}
                                            />
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        )}
                    </div>

                    {/* RIGHT SIDE: USER DROPDOWN (Hover vào tên / admin để mở drop) */}
                    <div className="flex items-center gap-3">
                        {loading ? (
                            <div className="h-8 w-24 animate-pulse rounded-md bg-slate-200/60" />
                        ) : user ? (
                            <>
                                <div
                                    className="relative hidden sm:block"
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {/* NÚT PROFILE / ADMIN BADGE CÓ HOVER */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDropdownOpen(!dropdownOpen)
                                        }
                                        className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-1.5 shadow-2xs hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer select-none"
                                    >
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-2xs">
                                            {(profile?.full_name ||
                                                user.email ||
                                                'U')[0].toUpperCase()}
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1.5">
                                                {profile?.full_name ||
                                                    user.email?.split('@')[0]}
                                                {isAdmin && (
                                                    <span className="inline-flex items-center gap-0.5 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                                                        <ShieldCheck className="h-3 w-3" />{' '}
                                                        Admin
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-[11.5px] text-slate-400 font-mono leading-tight">
                                                {user.email}
                                            </span>
                                        </div>
                                        <ChevronDown
                                            className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                                                dropdownOpen
                                                    ? 'rotate-180 text-slate-700'
                                                    : ''
                                            }`}
                                        />
                                    </button>

                                    {/* DROPDOWN MENU KHI DI CHUỘT / CLICK */}
                                    <AnimatePresence>
                                        {dropdownOpen && (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    y: 6,
                                                    scale: 0.98,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    y: 6,
                                                    scale: 0.98,
                                                }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 z-50 backdrop-blur-md"
                                            >
                                                {/* Header thông tin trong drop */}
                                                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                                    <p className="text-xs font-semibold text-slate-900 truncate">
                                                        {profile?.full_name ||
                                                            'Nhân viên Marketing'}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-mono truncate">
                                                        {user.email}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-1">
                                                        {isAdmin ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 rounded-md px-1.5 py-0.5">
                                                                <ShieldCheck className="h-3 w-3" />{' '}
                                                                Quản trị viên
                                                                (Admin)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 rounded-md px-1.5 py-0.5">
                                                                <UserIcon className="h-3 w-3" />{' '}
                                                                Nhân viên
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 1. Xem hồ sơ */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDropdownOpen(false);
                                                        setShowProfileModal(
                                                            true,
                                                        );
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition text-left"
                                                >
                                                    <UserIcon className="h-4 w-4 text-slate-500" />
                                                    <span>Xem hồ sơ</span>
                                                </button>

                                                {/* 2. Đổi mật khẩu */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDropdownOpen(false);
                                                        setShowPasswordModal(
                                                            true,
                                                        );
                                                        setPasswordError('');
                                                        setPasswordSuccess('');
                                                        setOldPassword('');
                                                        setNewPassword('');
                                                        setConfirmNewPassword(
                                                            '',
                                                        );
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition text-left"
                                                >
                                                    <KeyRound className="h-4 w-4 text-slate-500" />
                                                    <span>Đổi mật khẩu</span>
                                                </button>

                                                <div className="my-1 border-t border-slate-100" />

                                                {/* 3. Đăng xuất */}
                                                <button
                                                    type="button"
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-left"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    <span>Đăng xuất</span>
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Hamburger (Mobile) */}
                                <button
                                    onClick={() =>
                                        setMobileMenuOpen(!mobileMenuOpen)
                                    }
                                    className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
                                    aria-label="Mở menu"
                                >
                                    {mobileMenuOpen ? (
                                        <X className="h-4 w-4" />
                                    ) : (
                                        <Menu className="h-4 w-4" />
                                    )}
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
                                        {(profile?.full_name ||
                                            user.email ||
                                            'U')[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-900 truncate">
                                            {profile?.full_name ||
                                                user.email?.split('@')[0]}
                                        </p>
                                        <p className="text-xs text-slate-500 font-mono truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                    {isAdmin && (
                                        <span className="ml-auto shrink-0 inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                            <ShieldCheck className="h-3 w-3" />{' '}
                                            Admin
                                        </span>
                                    )}
                                </div>

                                {/* Nav links */}
                                {navLinks.map((link) => {
                                    const Icon = link.icon;
                                    const isActive =
                                        link.href === '/admin'
                                            ? pathname.startsWith('/admin')
                                            : pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                isActive
                                                    ? link.admin
                                                        ? 'bg-amber-50 text-amber-900 font-semibold'
                                                        : 'bg-slate-900/5 text-slate-900 font-semibold'
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                        >
                                            <Icon
                                                className={`h-4 w-4 ${link.admin ? 'text-amber-600' : 'text-slate-500'}`}
                                            />
                                            {link.label}
                                        </Link>
                                    );
                                })}

                                {/* Xem hồ sơ (Mobile) */}
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        setShowProfileModal(true);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                                >
                                    <UserIcon className="h-4 w-4 text-slate-500" />
                                    Xem hồ sơ
                                </button>

                                {/* Đổi mật khẩu (Mobile) */}
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        setShowPasswordModal(true);
                                        setPasswordError('');
                                        setPasswordSuccess('');
                                        setOldPassword('');
                                        setNewPassword('');
                                        setConfirmNewPassword('');
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                                >
                                    <KeyRound className="h-4 w-4 text-slate-500" />
                                    Đổi mật khẩu
                                </button>

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

            {/* MODAL 1: XEM HỒ SƠ */}
            <AnimatePresence>
                {showProfileModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                                        <UserIcon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Hồ sơ cá nhân
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Thông tin tài khoản thành viên DeepM
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowProfileModal(false)}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-4 space-y-3.5">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-base">
                                        {(profile?.full_name ||
                                            user?.email ||
                                            'U')[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-slate-900 truncate">
                                            {profile?.full_name ||
                                                'Chưa cập nhật tên'}
                                        </h4>
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold mt-0.5 ${
                                                isAdmin
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-slate-200 text-slate-800'
                                            }`}
                                        >
                                            <Shield className="h-3 w-3" />
                                            {isAdmin
                                                ? 'Quản trị viên (Admin)'
                                                : 'Nhân viên Marketing'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2.5 text-xs text-slate-600">
                                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 border border-slate-100">
                                        <span className="flex items-center gap-1.5 text-slate-500">
                                            <Mail className="h-3.5 w-3.5" />{' '}
                                            Email
                                        </span>
                                        <span className="font-mono font-medium text-slate-900">
                                            {user?.email}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 border border-slate-100">
                                        <span className="flex items-center gap-1.5 text-slate-500">
                                            <Calendar className="h-3.5 w-3.5" />{' '}
                                            Ngày đăng ký
                                        </span>
                                        <span className="font-mono font-medium text-slate-900">
                                            {user?.created_at
                                                ? new Date(
                                                      user.created_at,
                                                  ).toLocaleDateString('vi-VN')
                                                : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowProfileModal(false);
                                            setShowPasswordModal(true);
                                            setPasswordError('');
                                            setPasswordSuccess('');
                                            setOldPassword('');
                                            setNewPassword('');
                                            setConfirmNewPassword('');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                        <KeyRound className="h-3.5 w-3.5 text-slate-500" />{' '}
                                        Đổi mật khẩu
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowProfileModal(false)
                                        }
                                        className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 2: ĐỔI MẬT KHẨU (BẮT BUỘC ĐIỀN MẬT KHẨU CŨ) */}
            <AnimatePresence>
                {showPasswordModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                                        <KeyRound className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Đổi mật khẩu
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Yêu cầu xác minh mật khẩu hiện tại
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {passwordError && (
                                <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-sm text-rose-700">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                                    <span>{passwordError}</span>
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-sm text-emerald-800">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                                    <span>{passwordSuccess}</span>
                                </div>
                            )}

                            <form
                                onSubmit={handleChangePassword}
                                className="mt-4 space-y-3.5"
                            >
                                {/* 1. MẬT KHẨU CŨ */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Mật khẩu hiện tại (cũ){' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={
                                                showOldPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            required
                                            value={oldPassword}
                                            onChange={(e) =>
                                                setOldPassword(e.target.value)
                                            }
                                            placeholder="Nhập mật khẩu hiện tại"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowOldPassword(
                                                    !showOldPassword,
                                                )
                                            }
                                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                        >
                                            {showOldPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* 2. MẬT KHẨU MỚI */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Mật khẩu mới (tối thiểu 6 ký tự){' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={
                                                showNewPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            required
                                            value={newPassword}
                                            onChange={(e) =>
                                                setNewPassword(e.target.value)
                                            }
                                            placeholder="••••••••"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowNewPassword(
                                                    !showNewPassword,
                                                )
                                            }
                                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* 3. XÁC NHẬN MẬT KHẨU MỚI */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Xác nhận mật khẩu mới{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={
                                                showConfirmNewPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            required
                                            value={confirmNewPassword}
                                            onChange={(e) =>
                                                setConfirmNewPassword(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="••••••••"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmNewPassword(
                                                    !showConfirmNewPassword,
                                                )
                                            }
                                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmNewPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPasswordModal(false)
                                        }
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
                                    >
                                        {passwordLoading
                                            ? 'Đang xác minh...'
                                            : 'Lưu mật khẩu mới'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
