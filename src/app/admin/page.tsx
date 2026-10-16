'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Post, PLATFORMS } from '@/types/database';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Download,
  ExternalLink,
  Layers,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  EyeOff,
  ShieldAlert,
  Search,
  Calendar,
  UserPlus,
  X,
  KeyRound,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminNavTabs from '@/components/AdminNavTabs';

type TimePreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'CUSTOM';

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [allStaff, setAllStaff] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // State Modal Thêm nhân viên
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'staff' | 'admin'>('staff');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState('');
  const [createUserSuccess, setCreateUserSuccess] = useState('');

  // Filter states
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [selectedStaff, setSelectedStaff] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timePreset, setTimePreset] = useState<TimePreset>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Quản lý khoảng thời gian theo preset (ngày, tuần, tháng, quý, năm)
  const applyTimePreset = (preset: TimePreset) => {
    setTimePreset(preset);
    const now = new Date();

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
      return;
    }

    if (preset === 'TODAY') {
      const today = formatDate(now);
      setStartDate(today);
      setEndDate(today);
      return;
    }

    if (preset === 'YESTERDAY') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yStr = formatDate(yesterday);
      setStartDate(yStr);
      setEndDate(yStr);
      return;
    }

    if (preset === 'THIS_WEEK') {
      const dayOfWeek = now.getDay() || 7; // Thứ 2 là 1, CN là 7
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      setStartDate(formatDate(monday));
      setEndDate(formatDate(sunday));
      return;
    }

    if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(lastDay));
      return;
    }

    if (preset === 'THIS_QUARTER') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const firstDay = new Date(now.getFullYear(), currentQuarter * 3, 1);
      const lastDay = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(lastDay));
      return;
    }

    if (preset === 'THIS_YEAR') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(lastDay));
      return;
    }
  };

  const checkAdminAndFetchPosts = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const isAdmin = profile?.role === 'admin';

      if (!isAdmin) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      setIsAuthorized(true);

      const [postsRes, profilesRes] = await Promise.all([
        supabase
          .from('posts')
          .select('*, profiles:user_id(id, email, full_name, role)')
          .order('posted_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .order('created_at', { ascending: false }),
      ]);

      if (postsRes.error) throw postsRes.error;
      setPosts((postsRes.data as unknown as Post[]) || []);

      if (profilesRes.data) {
        setAllStaff(
          profilesRes.data.map((p) => ({
            id: p.id,
            name: p.full_name || p.email,
          }))
        );
      }
    } catch (err) {
      console.error('Lỗi lấy bài đăng admin:', err);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      await checkAdminAndFetchPosts();
      if (!isSubscribed) return;
    })();
    return () => {
      isSubscribed = false;
    };
  }, [checkAdminAndFetchPosts]);

  const staffList = useMemo(() => {
    if (allStaff.length > 0) return allStaff;
    const map = new Map<string, string>();
    posts.forEach((p) => {
      if (p.profiles) {
        map.set(p.profiles.id, p.profiles.full_name || p.profiles.email);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allStaff, posts]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError('');
    setCreateUserSuccess('');

    if (!newEmail.trim() || !newPassword.trim()) {
      setCreateUserError('Vui lòng điền đầy đủ Email và Mật khẩu.');
      return;
    }

    if (newPassword.length < 6) {
      setCreateUserError('Mật khẩu khởi tạo phải có ít nhất 6 ký tự.');
      return;
    }

    setCreatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: newFullName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo tài khoản nhân viên.');
      }

      setCreateUserSuccess(data.message || 'Tạo tài khoản thành công!');
      // Tải lại dữ liệu bài đăng và danh sách nhân viên
      await checkAdminAndFetchPosts();

      setTimeout(() => {
        setNewFullName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('staff');
        setShowAddUserModal(false);
        setCreateUserSuccess('');
      }, 1800);
    } catch (err: unknown) {
      const error = err as Error;
      setCreateUserError(error.message);
    } finally {
      setCreatingUser(false);
    }
  };

  // Lọc bài đăng
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (selectedPlatform !== 'ALL' && p.platform !== selectedPlatform) return false;
      if (selectedStaff !== 'ALL' && p.user_id !== selectedStaff) return false;

      if (startDate) {
        const pDate = new Date(p.posted_at).getTime();
        const sDate = new Date(startDate + 'T00:00:00').getTime();
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
  const exportToExcel = (exportScopePreset?: TimePreset) => {
    let targetPosts = filteredPosts;
    let scopeLabel = 'Bo_Loc_Hien_Tai';

    if (exportScopePreset && exportScopePreset !== timePreset) {
      // Nếu chọn xuất nhanh một mốc thời gian khác
      const now = new Date();
      let sTime = 0;
      let eTime = Number.MAX_SAFE_INTEGER;

      if (exportScopePreset === 'TODAY') {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        sTime = d;
        eTime = d + 86400000 - 1;
        scopeLabel = 'Hom_Nay';
      } else if (exportScopePreset === 'THIS_WEEK') {
        const dayOfWeek = now.getDay() || 7;
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dayOfWeek - 1)).getTime();
        sTime = monday;
        eTime = monday + 7 * 86400000 - 1;
        scopeLabel = 'Tuan_Nay';
      } else if (exportScopePreset === 'THIS_MONTH') {
        sTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        eTime = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
        scopeLabel = `Thang_${now.getMonth() + 1}_${now.getFullYear()}`;
      } else if (exportScopePreset === 'THIS_QUARTER') {
        const q = Math.floor(now.getMonth() / 3);
        sTime = new Date(now.getFullYear(), q * 3, 1).getTime();
        eTime = new Date(now.getFullYear(), (q + 1) * 3, 0, 23, 59, 59).getTime();
        scopeLabel = `Quy_${q + 1}_${now.getFullYear()}`;
      } else if (exportScopePreset === 'THIS_YEAR') {
        sTime = new Date(now.getFullYear(), 0, 1).getTime();
        eTime = new Date(now.getFullYear(), 11, 31, 23, 59, 59).getTime();
        scopeLabel = `Nam_${now.getFullYear()}`;
      }

      targetPosts = posts.filter((p) => {
        const pTime = new Date(p.posted_at).getTime();
        if (pTime < sTime || pTime > eTime) return false;
        // Áp dụng thêm bộ lọc platform và staff nếu đang được chọn
        if (selectedPlatform !== 'ALL' && p.platform !== selectedPlatform) return false;
        if (selectedStaff !== 'ALL' && p.user_id !== selectedStaff) return false;
        return true;
      });
    }

    if (targetPosts.length === 0) {
      alert('Không có dữ liệu bài đăng nào trong khoảng thời gian đã chọn để xuất file!');
      return;
    }

    const dataForExport = targetPosts.map((p, index) => ({
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo cáo Marketing DeepM');
    XLSX.writeFile(workbook, `DeepM_Bao_Cao_Marketing_${scopeLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
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
        <p className="mt-2 text-xs text-slate-500">
          Trang Dashboard này chỉ dành riêng cho Sếp / Quản trị viên (Admin).
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
        >
          Quay về trang báo cáo bài
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* THANH ĐIỀU HƯỚNG TỔNG QUAN / NHÂN SỰ */}
      <AdminNavTabs />

      {/* HEADER */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight sm:text-2xl flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-slate-900" />
            Dashboard Marketing DeepM
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Theo dõi tổng hợp tiến độ bài đăng, lọc chi tiết và xuất báo cáo Excel theo ngày/tuần/tháng/quý/năm.
          </p>
        </div>

        {/* NÚT HÀNH ĐỘNG ADMIN */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setShowAddUserModal(true);
              setCreateUserError('');
              setCreateUserSuccess('');
            }}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-[0.98] transition cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Thêm nhân viên
          </button>

          <button
            onClick={() => exportToExcel()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition cursor-pointer"
            title="Xuất file theo danh sách đang hiển thị"
          >
            <Download className="h-3.5 w-3.5" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-5 mb-6">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-700" /> Tổng bài đăng
          </span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.totalPosts}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-500" /> Tổng Likes
          </span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.totalLikes.toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5 text-blue-500" /> Tổng Bình luận
          </span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.totalComments.toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5 text-emerald-500" /> Tổng Lượt share
          </span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.totalShares.toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-purple-500" /> Tổng Lượt xem
          </span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.totalViews.toLocaleString()}</p>
        </div>
      </div>

      {/* FILTER BAR & THỜI GIAN PRESETS */}
      <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        {/* THANH CHỌN MỐC THỜI GIAN NHANH */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              Chọn mốc thời gian xuất báo cáo:
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'TODAY', label: 'Hôm nay' },
              { id: 'YESTERDAY', label: 'Hôm qua' },
              { id: 'THIS_WEEK', label: 'Tuần này' },
              { id: 'THIS_MONTH', label: 'Tháng này' },
              { id: 'THIS_QUARTER', label: 'Quý này' },
              { id: 'THIS_YEAR', label: 'Năm nay' },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => applyTimePreset(btn.id as TimePreset)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                  timePreset === btn.id
                    ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* CÁC BỘ LỌC CHI TIẾT */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-5">
          {/* Lọc nhân viên */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nhân viên</label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
            >
              <option value="ALL">Tất cả ({staffList.length} người)</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc kênh đăng */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kênh đăng</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setTimePreset('CUSTOM');
                setStartDate(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          {/* Đến ngày */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setTimePreset('CUSTOM');
                setEndDate(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          {/* Tìm kiếm */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tìm từ khóa</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Link, campaign, ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:bg-white"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* DANH SÁCH BÀI ĐĂNG */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200/80 px-5 py-3.5 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
              Danh sách bài đăng ({filteredPosts.length})
            </h2>
            {timePreset !== 'ALL' && (
              <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
                {timePreset === 'TODAY' && 'Hôm nay'}
                {timePreset === 'YESTERDAY' && 'Hôm qua'}
                {timePreset === 'THIS_WEEK' && 'Tuần này'}
                {timePreset === 'THIS_MONTH' && 'Tháng này'}
                {timePreset === 'THIS_QUARTER' && 'Quý này'}
                {timePreset === 'THIS_YEAR' && 'Năm nay'}
                {timePreset === 'CUSTOM' && `${startDate || '...'} đến ${endDate || '...'}`}
              </span>
            )}
          </div>

          <button
            onClick={() => exportToExcel()}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 hover:underline"
          >
            <Download className="h-4 w-4" /> Xuất danh sách này
          </button>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Không tìm thấy bài đăng nào phù hợp trong khoảng thời gian hoặc bộ lọc đã chọn.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Kênh & Định dạng</th>
                  <th className="px-4 py-3">Thời gian đăng</th>
                  <th className="px-4 py-3">Chi tiết & Link</th>
                  <th className="px-4 py-3 text-right">Tương tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
                          {(post.profiles?.full_name || post.profiles?.email || 'M')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {post.profiles?.full_name || post.profiles?.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">{post.profiles?.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-block rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-800 mb-1">
                        {post.platform}
                      </span>
                      <p className="text-xs text-slate-500">{post.content_type}</p>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-mono text-xs">
                      {new Date(post.posted_at).toLocaleString('vi-VN')}
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <a
                        href={post.post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-slate-900 hover:text-indigo-600 hover:underline truncate max-w-full font-mono text-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {post.post_url}
                      </a>
                      {post.campaign && (
                        <p className="text-xs text-amber-700 font-medium mt-0.5">
                          🎯 {post.campaign}
                        </p>
                      )}
                      {post.notes && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{post.notes}</p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2.5 font-medium text-xs">
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

      {/* MODAL THÊM NHÂN VIÊN MỚI */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Thêm nhân viên mới
                    </h3>
                    <p className="text-xs text-slate-400">
                      Cấp tài khoản đăng nhập hệ thống DeepM Marketing
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {createUserError && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{createUserError}</span>
                </div>
              )}

              {createUserSuccess && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{createUserSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="mt-5 space-y-4">
                {/* 1. HỌ VÀ TÊN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Họ và tên nhân viên <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                    <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* 2. EMAIL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email công việc <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="nhanvien@deepm.vn hoặc gmail"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* 3. MẬT KHẨU KHỞI TẠO */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomPass = 'DeepM@' + Math.floor(1000 + Math.random() * 9000);
                        setNewPassword(randomPass);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Tạo ngẫu nhiên
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự (ví dụ: DeepM@2026)"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                    <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Nhân viên có thể tự đổi sang mật khẩu riêng sau khi đăng nhập.
                  </p>
                </div>

                {/* 4. VAI TRÒ */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Vai trò hệ thống
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition ${
                        newRole === 'staff'
                          ? 'border-slate-900 bg-slate-900/5'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        value="staff"
                        checked={newRole === 'staff'}
                        onChange={() => setNewRole('staff')}
                        className="text-slate-900 focus:ring-slate-900"
                      />
                      <div className="text-xs">
                        <p className="font-semibold text-slate-900">Nhân viên</p>
                        <p className="text-slate-500 text-[11px]">Báo cáo & bài của mình</p>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition ${
                        newRole === 'admin'
                          ? 'border-amber-600 bg-amber-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        value="admin"
                        checked={newRole === 'admin'}
                        onChange={() => setNewRole('admin')}
                        className="text-amber-600 focus:ring-amber-600"
                      />
                      <div className="text-xs">
                        <p className="font-semibold text-amber-900 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-amber-600" /> Admin
                        </p>
                        <p className="text-amber-700 text-[11px]">Xem toàn bộ & xuất file</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* NÚT SUBMIT */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition active:scale-[0.98]"
                  >
                    {creatingUser ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Tạo tài khoản
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
