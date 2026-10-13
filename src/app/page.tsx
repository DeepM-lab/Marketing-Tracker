'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PLATFORMS, CONTENT_TYPES } from '@/types/database';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Calendar,
  Layers,
  FileText,
  BarChart2,
} from 'lucide-react';

export default function SubmitPostPage() {
  const router = useRouter();
  const supabase = createClient();

  // Kiểm tra đăng nhập
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  // Form states - Các trường BẮT BUỘC
  const [platform, setPlatform] = useState<string>(PLATFORMS[0]);
  const [postedAt, setPostedAt] = useState<string>('');
  const [postUrl, setPostUrl] = useState<string>('');
  const [contentType, setContentType] = useState<string>(CONTENT_TYPES[0]);

  // Form states - Các trường TÙY CHỌN / MỞ RỘNG
  const [campaign, setCampaign] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [likes, setLikes] = useState<number>(0);
  const [comments, setComments] = useState<number>(0);
  const [shares, setShares] = useState<number>(0);
  const [views, setViews] = useState<number>(0);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tự động gán giờ hiện tại làm giá trị mặc định cho posted_at
  useEffect(() => {
    const now = new Date();
    // Format YYYY-MM-DDThh:mm cho input type="datetime-local"
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    setPostedAt(localISOTime);

    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUserEmail(session.user.email || '');
        setCheckingAuth(false);
      }
    }
    checkUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Vui lòng đăng nhập để gửi bài báo cáo!');
      }

      // Kiểm tra các trường bắt buộc
      if (!platform.trim() || !postedAt.trim() || !postUrl.trim() || !contentType.trim()) {
        throw new Error('Vui lòng điền đầy đủ các trường bắt buộc (*)');
      }

      const { error } = await supabase.from('posts').insert({
        user_id: session.user.id,
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
      // Reset form một phần để tiện nhập bài tiếp theo
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-600" />
          Báo cáo bài đăng Marketing
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Điền thông tin bài bạn vừa đăng để ghi nhận tiến độ công việc. Đang báo cáo dưới tài khoản:{' '}
          <span className="font-semibold text-slate-700">{userEmail}</span>
        </p>
      </div>

      {success && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Báo cáo bài đăng thành công!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Dữ liệu đã được lưu vào hệ thống để sếp theo dõi. Bạn có thể tiếp tục nhập bài khác hoặc xem ở trang &ldquo;Bài của tôi&rdquo;.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Có lỗi xảy ra</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        {/* KHỐI 1: THÔNG TIN BẮT BUỘC */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-700 font-bold">1</span>
            Thông tin bắt buộc
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* 1. Kênh đăng */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kênh đăng <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Ngày giờ đăng */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Ngày & giờ đăng <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={postedAt}
                onChange={(e) => setPostedAt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* 3. Loại nội dung */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                Loại nội dung <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              >
                {CONTENT_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Link bài đăng */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                Link bài đăng (URL) <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://facebook.com/... hoặc https://tiktok.com/@.../video/..."
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* KHỐI 2: THÔNG TIN TÙY CHỌN & SỐ LIỆU */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600 font-bold">2</span>
            Chiến dịch & Ghi chú (Không bắt buộc)
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chiến dịch / Campaign
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Tết 2026, Ra mắt sản phẩm X..."
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Ghi chú nội dung / Key Message
              </label>
              <textarea
                rows={2}
                placeholder="Mô tả tóm tắt nội dung bài đăng, góc tiếp cận..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* KHỐI 3: SỐ LIỆU TƯƠNG TÁC BAN ĐẦU */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600 font-bold">3</span>
              Số liệu tương tác ban đầu (Có thể cập nhật sau)
            </h2>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5" /> Mặc định là 0
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Likes / Reacts</label>
              <input
                type="number"
                min="0"
                value={likes}
                onChange={(e) => setLikes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-center font-semibold text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bình luận</label>
              <input
                type="number"
                min="0"
                value={comments}
                onChange={(e) => setComments(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-center font-semibold text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Chia sẻ</label>
              <input
                type="number"
                min="0"
                value={shares}
                onChange={(e) => setShares(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-center font-semibold text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lượt xem (Views)</label>
              <input
                type="number"
                min="0"
                value={views}
                onChange={(e) => setViews(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-center font-semibold text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* NÚT GỬI */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.99] transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang lưu bài đăng...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Gửi báo cáo bài đăng
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
