'use client';

import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { translateSupabaseError } from '@/lib/utils/errorMessages';
import {
    LogIn,
    UserPlus,
    AlertCircle,
    Eye,
    EyeOff,
    ArrowLeft,
    Mail,
    KeyRound,
    CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export default function LoginPage() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Lắng nghe sự kiện PASSWORD_RECOVERY từ link email Supabase
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setMode('reset');
                setSuccessMsg(
                    'Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn.',
                );
            }
        });
        
        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    const resetMessages = () => {
        setErrorMsg('');
        setSuccessMsg('');
    };

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        resetMessages();
        setPassword('');
        setConfirmPassword('');
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        resetMessages();

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login`,
            });
            if (error) throw error;
            setSuccessMsg(
                'Đã gửi email đặt lại mật khẩu! Vui lòng kiểm tra hộp thư (kể cả thư mục Spam/Rác).',
            );
        } catch (err: unknown) {
            const error = err as Error;
            setErrorMsg(
                translateSupabaseError(error.message) ||
                    'Đã có lỗi xảy ra. Vui lòng thử lại.',
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        resetMessages();

        if (password.length < 6) {
            setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Mật khẩu xác nhận không khớp.');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });
            if (error) throw error;

            setSuccessMsg(
                'Cập nhật mật khẩu thành công! Đang chuyển hướng vào hệ thống...',
            );
            setTimeout(() => {
                router.push('/');
                router.refresh();
            }, 1500);
        } catch (err: unknown) {
            const error = err as Error;
            setErrorMsg(
                translateSupabaseError(error.message) ||
                    'Không thể đặt lại mật khẩu.',
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        resetMessages();

        try {
            if (mode === 'signup') {
                if (password !== confirmPassword) {
                    throw new Error(
                        'Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.',
                    );
                }
                if (password.length < 6) {
                    throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
                }

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                setSuccessMsg(
                    'Đăng ký thành công! Hãy đăng nhập bằng tài khoản vừa tạo.',
                );
                switchMode('login');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/');
                router.refresh();
            }
        } catch (err: unknown) {
            const error = err as Error;
            setErrorMsg(
                translateSupabaseError(error.message) ||
                    'Đã có lỗi xảy ra. Vui lòng thử lại.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-[calc(100vh-115px)] flex items-center justify-center p-4 bg-grid-subtle">
            <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-slate-50/60 to-slate-50" />

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="relative w-full max-w-105 rounded-2xl border border-slate-200/90 bg-white p-7 sm:p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm"
            >
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 flex items-center justify-center">
                        <Image
                            width={56}
                            height={56}
                            src="/logo.png"
                            alt="DeepM Logo"
                            className="h-14 w-14 object-contain rounded-xl"
                        />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                        {mode === 'signup'
                            ? 'Tạo tài khoản DeepM'
                            : mode === 'forgot'
                              ? 'Quên mật khẩu'
                              : mode === 'reset'
                                ? 'Thiết lập mật khẩu mới'
                                : 'Đăng nhập DeepM Marketing'}
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                        {mode === 'signup'
                            ? 'Nhập thông tin nhân viên để bắt đầu báo cáo bài đăng'
                            : mode === 'forgot'
                              ? 'Nhập email để nhận liên kết đặt lại mật khẩu'
                              : mode === 'reset'
                                ? 'Nhập mật khẩu mới cho tài khoản của bạn'
                                : 'Hệ thống quản lý & theo dõi tiến độ marketing nội bộ'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {errorMsg && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200/80 bg-rose-50/70 p-3 text-xs text-rose-700"
                        >
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                            <span>{errorMsg}</span>
                        </motion.div>
                    )}

                    {successMsg && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3 text-xs text-emerald-800"
                        >
                            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                            <span>{successMsg}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* RESET PASSWORD FROM EMAIL LINK */}
                {mode === 'reset' ? (
                    <form
                        onSubmit={handleResetPassword}
                        className="space-y-3.5"
                    >
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Mật khẩu mới (tối thiểu 6 ký tự)
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 pr-9 text-xs font-normal text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-3.5 w-3.5" />
                                    ) : (
                                        <Eye className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Nhập lại mật khẩu mới
                            </label>
                            <div className="relative">
                                <input
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    required
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 pr-9 text-xs font-normal text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword,
                                        )
                                    }
                                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-3.5 w-3.5" />
                                    ) : (
                                        <Eye className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-[0.98] transition disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <>
                                    <KeyRound className="h-3.5 w-3.5" /> Lưu mật
                                    khẩu mới
                                </>
                            )}
                        </button>
                    </form>
                ) : mode === 'forgot' ? (
                    /* FORGOT PASSWORD FORM */
                    <form
                        onSubmit={handleForgotPassword}
                        className="space-y-3.5"
                    >
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Email công việc
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ten@congty.com"
                                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-normal text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                />
                                <Mail className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-[0.98] transition disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <>
                                    <Mail className="h-3.5 w-3.5" /> Gửi link
                                    đặt lại mật khẩu
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => switchMode('login')}
                            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition pt-1"
                        >
                            <ArrowLeft className="h-3 w-3" /> Quay lại đăng nhập
                        </button>
                    </form>
                ) : (
                    /* LOGIN / SIGNUP FORM */
                    <form onSubmit={handleAuth} className="space-y-3.5">
                        {mode === 'signup' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Họ và tên
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) =>
                                        setFullName(e.target.value)
                                    }
                                    placeholder="Nguyễn Văn A"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-normal text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Email công việc
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ten@congty.com"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-normal text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 pr-9 text-xs font-normal text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-3.5 w-3.5" />
                                    ) : (
                                        <Eye className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {mode === 'signup' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Nhập lại mật khẩu
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showConfirmPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        required
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 pr-9 text-xs font-normal text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword,
                                            )
                                        }
                                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-3.5 w-3.5" />
                                        ) : (
                                            <Eye className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {mode === 'login' && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => switchMode('forgot')}
                                    className="text-[11px] text-slate-400 hover:text-slate-700 transition underline underline-offset-2"
                                >
                                    Quên mật khẩu?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-[0.98] transition disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : mode === 'signup' ? (
                                <>
                                    <UserPlus className="h-3.5 w-3.5" /> Đăng ký
                                    tài khoản
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-3.5 w-3.5" /> Đăng nhập
                                </>
                            )}
                        </button>
                    </form>
                )}

                {mode !== 'forgot' && mode !== 'reset' && (
                    <div className="mt-5 border-t border-slate-100 pt-4 text-center">
                        <button
                            type="button"
                            onClick={() =>
                                switchMode(
                                    mode === 'login' ? 'signup' : 'login',
                                )
                            }
                            className="text-xs font-medium text-slate-600 hover:text-slate-900 transition underline underline-offset-4"
                        >
                            {mode === 'signup'
                                ? 'Đã có tài khoản? Đăng nhập ngay'
                                : 'Chưa có tài khoản? Nhấn để đăng ký'}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
