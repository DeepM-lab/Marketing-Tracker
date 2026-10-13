'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogIn, UserPlus, Sparkles, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
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
        setSuccessMsg('Đăng ký thành công! Hãy đăng nhập bằng tài khoản vừa tạo.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
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
      setErrorMsg(error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
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
        className="relative w-full max-w-[400px] rounded-2xl border border-slate-200/90 bg-white p-7 sm:p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {isSignUp ? 'Tạo tài khoản mới' : 'Đăng nhập MktTracker'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {isSignUp
              ? 'Nhập thông tin nhân viên để bắt đầu báo cáo bài'
              : 'Theo dõi và tổng hợp tiến độ marketing nội bộ'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
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
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3 text-xs text-emerald-800"
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleAuth} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 pr-9 text-xs font-normal text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nhập lại mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 pr-9 text-xs font-normal text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-[0.98] transition disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isSignUp ? (
              <>
                <UserPlus className="h-3.5 w-3.5" /> Đăng ký tài khoản
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5" /> Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="mt-5 border-t border-slate-100 pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setSuccessMsg('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 transition underline underline-offset-4"
          >
            {isSignUp
              ? 'Đã có tài khoản? Đăng nhập ngay'
              : 'Chưa có tài khoản? Nhấn để đăng ký'}
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span>
            Admin quản trị: <strong className="text-slate-700 font-mono">deepmlab12@gmail.com</strong>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
