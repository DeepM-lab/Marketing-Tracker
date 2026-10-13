'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Post, PLATFORMS } from '@/types/database';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Download,
  Filter,
  ExternalLink,
  Users,
  Layers,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  ShieldAlert,
  Search,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Filter states
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [selectedStaff, setSelectedStaff] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const checkAdminAndFetchPosts = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const isAdmin =
        profile?.role === 'admin' || session.user.email === 'deepmlab12@gmail.com';

      if (!isAdmin) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      setIsAuthorized(true);

      // Lấy toàn bộ bài đăng kèm thông tin người đăng
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:user_id(id, email, full_name, role)')
        .order('posted_at', { ascending: false });

      if (error) throw error;
      setPosts((data as unknown as Post[]) || []);
    } catch (err) {
      console.error('Lỗi lấy bài đăng admin:', err);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    checkAdminAndFetchPosts();
  }, [checkAdminAndFetchPosts]);

  // Danh sách các nhân viên duy nhất trong hệ thống
  const staffList = useMemo(() => {
    const map = new Map<string, string>();
    posts.forEach((p) => {
      if (p.profiles) {
        map.set(p.profiles.id, p.profiles.full_name || p.profiles.email);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [posts]);

  // Lọc bài đăng
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (selectedPlatform !== 'ALL' && p.platform !== selectedPlatform) return false;
      if (selectedStaff !== 'ALL' && p.user_id !== selectedStaff) return false;

      if (startDate) {
        const pDate = new Date(p.posted_at).getTime();
        const sDate = new Date(startDate).getTime();
        if (pDate < sDate) return false;
      }

      if (endDate) {
        const pDate = new Date(p.posted_at).getTime();
        const eDate = new Date(endDate + 'T23:59:59').getTime();
        if (pDate > eDate) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const urlMatch = p.post_url.toLowerCase().includes(term);
        const campMatch = p.campaign?.toLowerCase().includes(term) ?? false;
        const notesMatch = p.notes?.toLowerCase().includes(term) ?? false;
        const authorMatch =
          p.profiles?.full_name?.toLowerCase().includes(term) ||
          p.profiles?.email?.toLowerCase().includes(term);
        if (!urlMatch && !campMatch && !notesMatch && !authorMatch) return false;
      }

      return true;
    });
  }, [posts, selectedPlatform, selectedStaff, startDate, endDate, searchTerm]);

  // Thống kê tổng hợp
  const stats = useMemo(() => {
    const totalPosts = filteredPosts.length;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalViews = 0;

    filteredPosts.forEach((p) => {
      totalLikes += p.likes || 0;
      totalComments += p.comments || 0;
      totalShares += p.shares || 0;
      totalViews += p.views || 0;
    });

    return { totalPosts, totalLikes, totalComments, totalShares, totalViews };
  }, [filteredPosts]);

  // Xuất file Excel
  const exportToExcel = () => {
    const dataForExport = filteredPosts.map((p, index) => ({
      STT: index + 1,
      'Người đăng': p.profiles?.full_name || p.profiles?.email || 'N/A',
      Email: p.profiles?.email || 'N/A',
      'Kênh đăng': p.platform,
      'Ngày giờ đăng': new Date(p.posted_at).toLocaleString('vi-VN'),
      'Loại nội dung': p.content_type,
      'Link bài': p.post_url,
      'Chiến dịch': p.campaign || '',
      Likes: p.likes || 0,
      'Bình luận': p.comments || 0,
      'Chia sẻ': p.shares || 0,
      Views: p.views || 0,
      'Ghi chú': p.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo cáo Marketing');
    XLSX.writeFile(workbook, `Bao_Cao_Marketing_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Không có quyền truy cập</h2>
        <p className="mt-2 text-sm text-slate-500">
          Trang Dashboard này chỉ dành riêng cho Sếp / Quản trị viên (Admin).
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-700"
        >
          Quay về trang báo cáo bài
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
            Dashboard Quản lý Tiến độ Marketing
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Nơi sếp theo dõi toàn bộ bài đăng của anh em marketing, lọc theo nhân viên, kênh và xuất báo cáo.
          </p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 transition w-fit"
        >
          <Download className="h-4 w-4" />
          Xuất file Excel báo cáo
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-600" /> Tổng bài đăng
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalPosts}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-rose-600" /> Tổng Likes
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalLikes.toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4 text-blue-600" /> Tổng Bình luận
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalComments.toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Share2 className="h-4 w-4 text-emerald-600" /> Tổng Lượt share
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalShares.toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-purple-600" /> Tổng Lượt xem
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalViews.toLocaleString()}</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Filter className="h-4 w-4" /> Bộ lọc dữ liệu
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
          {/* Lọc nhân viên */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nhân viên marketing</label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
            >
              <option value="ALL">Tất cả nhân viên ({staffList.length})</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc kênh đăng */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kênh đăng</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
            >
              <option value="ALL">Tất cả kênh</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Từ ngày */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          {/* Đến ngày */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          {/* Tìm kiếm */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tìm từ khóa</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Link, campaign, ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs outline-none focus:border-indigo-600 focus:bg-white"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* DANH SÁCH BÀI ĐĂNG */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Danh sách bài đăng ({filteredPosts.length})
          </h2>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Không tìm thấy bài đăng nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Kênh & Loại bài</th>
                  <th className="px-4 py-3">Thời gian đăng</th>
                  <th className="px-4 py-3">Chi tiết & Link</th>
                  <th className="px-4 py-3 text-right">Tương tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50 transition">
                    {/* Người đăng */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
                          {(post.profiles?.full_name || post.profiles?.email || 'M')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {post.profiles?.full_name || post.profiles?.email?.split('@')[0]}
                          </p>
                          <p className="text-[10px] text-slate-400">{post.profiles?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Kênh & Content type */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 mb-1">
                        {post.platform}
                      </span>
                      <p className="text-[11px] text-slate-500">{post.content_type}</p>
                    </td>

                    {/* Thời gian */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      {new Date(post.posted_at).toLocaleString('vi-VN')}
                    </td>

                    {/* Link & Ghi chú */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <a
                        href={post.post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline truncate max-w-full"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        {post.post_url}
                      </a>
                      {post.campaign && (
                        <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                          🎯 {post.campaign}
                        </p>
                      )}
                      {post.notes && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{post.notes}</p>
                      )}
                    </td>

                    {/* Tương tác */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2.5 font-medium text-[11px]">
                        <span className="text-rose-600" title="Likes">
                          ❤️ {(post.likes || 0).toLocaleString()}
                        </span>
                        <span className="text-blue-600" title="Comments">
                          💬 {(post.comments || 0).toLocaleString()}
                        </span>
                        <span className="text-emerald-600" title="Shares">
                          🔄 {(post.shares || 0).toLocaleString()}
                        </span>
                        <span className="text-purple-600" title="Views">
                          👁️ {(post.views || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
