'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PLATFORMS, CONTENT_TYPES } from '@/types/database';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Calendar,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const getNowLocalISO = () => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
};

export default function SubmitPostPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Auth state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  // Required form states
  const [platform, setPlatform] = useState<string>(PLATFORMS[0]);
  const [postedAt, setPostedAt] = useState<string>('');
  const [postUrl, setPostUrl] = useState<string>('');
  const [contentType, setContentType] = useState<string>(CONTENT_TYPES[0]);

  // Optional form states
  const [campaign, setCampaign] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [likes, setLikes] = useState<number>(0);
  const [comments, setComments] = useState<number>(0);
  const [shares, setShares] = useState<number>(0);
  const [views, setViews] = useState<number>(0);

  // Submission feedback
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      if (isSubscribed) {
        setPostedAt(getNowLocalISO());
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!isSubscribed) return;
      if (!user) {
        router.push('/login');
      } else {
        setUserEmail(user.email || '');
        setCheckingAuth(false);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Vui lòng đăng nhập để gửi báo cáo!');
      }

      if (!platform.trim() || !postedAt.trim() || !postUrl.trim() || !contentType.trim()) {
        throw new Error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        platform,
        posted_at: new Date(postedAt).toISOString(),
        post_url: postUrl.trim(),
        content_type: contentType,
        campaign: campaign.trim() || null,
        notes: notes.trim() || null,
        likes: Number(likes) || 0,
        comments: Number(comments) || 0,
        shares: Number(shares) || 0,
        views: Number(views) || 0,
      });

      if (error) throw error;

      setSuccess(true);
      // Xóa sạch toàn bộ form để nhân viên điền bài tiếp theo
      setPlatform(PLATFORMS[0]);
      setContentType(CONTENT_TYPES[0]);
      setPostedAt(getNowLocalISO());
      setCampaign('');
      setPostUrl('');
      setNotes('');
      setLikes(0);
      setComments(0);
      setShares(0);
      setViews(0);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Không thể lưu bài đăng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Báo cáo bài đăng
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Ghi nhận tiến độ phân phối nội dung cho chiến dịch marketing của DeepM.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 w-fit">
          {userEmail}
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 shadow-2xs"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-emerald-950">Đã lưu bài đăng thành công!</p>
              <p className="text-emerald-700 mt-0.5">
                Dữ liệu đã được cập nhật vào dashboard. Bạn có thể xem hoặc chỉnh sửa số liệu sau tại mục &ldquo;Bài của tôi&rdquo;.
              </p>
            </div>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-2xs"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-rose-950">Chưa thể gửi dữ liệu</p>
              <p className="text-rose-700 mt-0.5">{errorMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs"
      >
        {/* KHỐI 1: THÔNG TIN BẮT BUỘC */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
              1
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Thông tin bắt buộc
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Kênh đăng <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                Thời gian đăng <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={postedAt}
                onChange={(e) => setPostedAt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-slate-400" />
                Định dạng nội dung <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
              >
                {CONTENT_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Chiến dịch (Campaign)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Chiến dịch Q4, Khuyến mãi..."
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-800 mb-1.5 flex items-center gap-1.5">
                <ExternalLink className="h-4 w-4 text-slate-400" />
                Đường dẫn bài đăng (URL) <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://facebook.com/... hoặc https://tiktok.com/@.../video/..."
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* KHỐI 2: GHI CHÚ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
              2
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Ghi chú nội dung (Tùy chọn)
            </h2>
          </div>

          <div>
            <textarea
              rows={5}
              placeholder="Tóm tắt thông điệp cốt lõi, góc tiếp cận bài viết, mục tiêu chiến dịch, hoặc các lưu ý khác..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 leading-relaxed outline-none transition focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 min-h-[120px] resize-y"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* KHỐI 3: SỐ LIỆU */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                3
              </span>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                Số liệu ban đầu
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Có thể để 0 và cập nhật sau
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/30 p-2.5 text-center">
              <label className="text-xs font-medium text-slate-600 block mb-1">Likes / Reacts</label>
              <input
                type="number"
                min="0"
                value={likes}
                onChange={(e) => setLikes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 text-sm text-center font-semibold text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/30 p-2.5 text-center">
              <label className="text-xs font-medium text-slate-600 block mb-1">Bình luận</label>
              <input
                type="number"
                min="0"
                value={comments}
                onChange={(e) => setComments(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 text-sm text-center font-semibold text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/30 p-2.5 text-center">
              <label className="text-xs font-medium text-slate-600 block mb-1">Chia sẻ</label>
              <input
                type="number"
                min="0"
                value={shares}
                onChange={(e) => setShares(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 text-sm text-center font-semibold text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/30 p-2.5 text-center">
              <label className="text-xs font-medium text-slate-600 block mb-1">Lượt xem</label>
              <input
                type="number"
                min="0"
                value={views}
                onChange={(e) => setViews(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 text-sm text-center font-semibold text-slate-900 outline-none focus:border-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-[0.99] transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang lưu...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Gửi báo cáo bài đăng
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
