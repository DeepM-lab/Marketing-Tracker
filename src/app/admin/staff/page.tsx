'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminNavTabs from '@/components/AdminNavTabs';
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  Mail,
  User as UserIcon,
  Layers,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  role: 'staff' | 'admin';
  created_at: string;
  posts_count: number;
}

export default function StaffManagementPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'staff' | 'admin'>('ALL');

  // Modal 1: Thêm nhân viên
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'staff' | 'admin'>('staff');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Modal 2: Đặt lại mật khẩu nhân viên
  const [resetStaff, setResetStaff] = useState<StaffMember | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Modal 3: Xác nhận xóa nhân viên
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  // Nạp danh sách nhân viên
  const fetchStaffData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);

      // Kiểm tra quyền Admin
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (myProfile?.role !== 'admin') {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      setIsAuthorized(true);

      const res = await fetch('/api/admin/users');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể tải danh sách nhân viên.');
      }

      setStaffList(data.staff || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách nhân viên:', err);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      await fetchStaffData();
      if (!isSubscribed) return;
    })();
    return () => {
      isSubscribed = false;
    };
  }, [fetchStaffData]);

  // Thống kê số lượng
  const stats = useMemo(() => {
    const total = staffList.length;
    const admins = staffList.filter((s) => s.role === 'admin').length;
    const staff = staffList.filter((s) => s.role === 'staff').length;
    const totalPosts = staffList.reduce((acc, curr) => acc + (curr.posts_count || 0), 0);
    return { total, admins, staff, totalPosts };
  }, [staffList]);

  // Bộ lọc tìm kiếm
  const filteredStaff = useMemo(() => {
    return staffList.filter((member) => {
      if (roleFilter !== 'ALL' && member.role !== roleFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const name = (member.full_name || '').toLowerCase();
        const email = member.email.toLowerCase();
        return name.includes(query) || email.includes(query);
      }
      return true;
    });
  }, [staffList, roleFilter, searchTerm]);

  // 1. Xử lý Thêm nhân viên mới
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!newEmail.trim() || !newPassword.trim()) {
      setModalError('Vui lòng điền đầy đủ Email và Mật khẩu.');
      return;
    }

    if (newPassword.length < 6) {
      setModalError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newFullName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể tạo tài khoản.');

      setModalSuccess(data.message || 'Tạo tài khoản thành công!');
      await fetchStaffData();

      setTimeout(() => {
        setShowAddModal(false);
        setNewFullName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('staff');
        setModalSuccess('');
      }, 1500);
    } catch (err: unknown) {
      const error = err as Error;
      setModalError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Xử lý Đổi vai trò (Nâng lên Admin / Hạ xuống Staff)
  const handleToggleRole = async (member: StaffMember) => {
    if (member.id === currentUserId) {
      alert('Bạn không thể tự thay đổi vai trò của chính mình.');
      return;
    }

    const nextRole = member.role === 'admin' ? 'staff' : 'admin';
    const confirmMsg =
      nextRole === 'admin'
        ? `Bạn có chắc muốn cấp quyền Quản trị viên (Admin) cho "${member.full_name || member.email}"?`
        : `Bạn có chắc muốn chuyển "${member.full_name || member.email}" về quyền Nhân viên thông thường?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: member.id,
          role: nextRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể thay đổi quyền.');

      await fetchStaffData();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
    }
  };

  // 3. Xử lý Đặt lại mật khẩu cho nhân viên
  const handleResetStaffPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetStaff) return;
    setModalError('');
    setModalSuccess('');

    if (resetPassword.length < 6) {
      setModalError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resetStaff.id,
          newPassword: resetPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể đặt lại mật khẩu.');

      setModalSuccess('Đã đổi mật khẩu mới cho nhân viên thành công!');
      setTimeout(() => {
        setResetStaff(null);
        setResetPassword('');
        setModalSuccess('');
      }, 1500);
    } catch (err: unknown) {
      const error = err as Error;
      setModalError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Xử lý Xóa nhân viên nghỉ việc
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.id === currentUserId) {
      alert('Bạn không thể tự xóa tài khoản của chính mình.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users?userId=${deleteTarget.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể xóa tài khoản.');

      await fetchStaffData();
      setDeleteTarget(null);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
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
          Khu vực quản lý nhân sự chỉ dành riêng cho Quản trị viên (Admin).
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
            <Users className="h-6 w-6 text-slate-900" />
            Quản lý nhân sự DeepM
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Xem danh sách nhân viên, cấp tài khoản, đổi quyền hạn hoặc xóa tài khoản khi nhân viên nghỉ việc.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setModalError('');
            setModalSuccess('');
          }}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-[0.98] transition cursor-pointer w-fit"
        >
          <UserPlus className="h-4 w-4" />
          Thêm nhân viên mới
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 mb-6">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-700" /> Tổng nhân sự
          </span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.total}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-indigo-600" /> Nhân viên Marketing
          </span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.staff}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" /> Quản trị viên (Admin)
          </span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.admins}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-emerald-600" /> Tổng bài đã đăng
          </span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.totalPosts}</p>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:bg-white"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-1.5">
          {(
            [
              { id: 'ALL', label: 'Tất cả' },
              { id: 'staff', label: 'Nhân viên' },
              { id: 'admin', label: 'Admin' },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              onClick={() => setRoleFilter(btn.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                roleFilter === btn.id
                  ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* DANH SÁCH NHÂN VIÊN */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200/80 px-5 py-3.5 flex items-center justify-between bg-slate-50/40">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
            Danh sách nhân sự ({filteredStaff.length})
          </h2>
        </div>

        {filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Không tìm thấy nhân viên nào phù hợp với từ khóa tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Họ tên & Email</th>
                  <th className="px-4 py-3.5">Vai trò</th>
                  <th className="px-4 py-3.5 text-center">Bài đã đăng</th>
                  <th className="px-4 py-3.5">Ngày tham gia</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((member) => {
                  const isMe = member.id === currentUserId;
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition">
                      {/* 1. HỌ TÊN & EMAIL */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-2xs">
                            {(member.full_name || member.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {member.full_name || 'Chưa cập nhật tên'}
                              {isMe && (
                                <span className="rounded-md bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700">
                                  Bạn
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. VAI TRÒ */}
                      <td className="px-4 py-4">
                        {member.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                            Quản trị viên
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                            Nhân viên
                          </span>
                        )}
                      </td>

                      {/* 3. BÀI ĐÃ ĐĂNG */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-block rounded-lg bg-slate-100 font-semibold px-2.5 py-1 text-xs text-slate-800">
                          {member.posts_count || 0} bài
                        </span>
                      </td>

                      {/* 4. NGÀY THAM GIA */}
                      <td className="px-4 py-4 whitespace-nowrap text-slate-500 text-xs font-mono">
                        {member.created_at
                          ? new Date(member.created_at).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </td>

                      {/* 5. THAO TÁC */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Đổi quyền */}
                          {!isMe && (
                            <button
                              type="button"
                              onClick={() => handleToggleRole(member)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                              title={
                                member.role === 'admin'
                                  ? 'Chuyển về Nhân viên'
                                  : 'Nâng lên Quản trị viên'
                              }
                            >
                              {member.role === 'admin' ? 'Hạ quyền' : 'Lên Admin'}
                            </button>
                          )}

                          {/* Đặt lại mật khẩu */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetStaff(member);
                              setResetPassword('');
                              setModalError('');
                              setModalSuccess('');
                            }}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                            title="Đặt lại mật khẩu cho nhân viên"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>

                          {/* Xóa nhân viên */}
                          {!isMe && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(member)}
                              className="rounded-lg border border-rose-200 bg-rose-50/50 p-1.5 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition"
                              title="Xóa tài khoản nhân viên khi nghỉ việc"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: THÊM NHÂN VIÊN MỚI */}
      <AnimatePresence>
        {showAddModal && (
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
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {modalError && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="mt-5 space-y-4">
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
                      placeholder="Tối thiểu 6 ký tự"
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
                </div>

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
                        name="addStaffRole"
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
                        name="addStaffRole"
                        value="admin"
                        checked={newRole === 'admin'}
                        onChange={() => setNewRole('admin')}
                        className="text-amber-600 focus:ring-amber-600"
                      />
                      <div className="text-xs">
                        <p className="font-semibold text-amber-900 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-amber-600" /> Admin
                        </p>
                        <p className="text-amber-700 text-[11px]">Toàn quyền quản trị</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition active:scale-[0.98]"
                  >
                    {actionLoading ? (
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

      {/* MODAL 2: ĐẶT LẠI MẬT KHẨU CHO NHÂN VIÊN */}
      <AnimatePresence>
        {resetStaff && (
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
                      Đổi mật khẩu nhân viên
                    </h3>
                    <p className="text-xs text-slate-400 truncate max-w-50">
                      {resetStaff.full_name || resetStaff.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResetStaff(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {modalError && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <form onSubmit={handleResetStaffPassword} className="mt-4 space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Mật khẩu mới (tối thiểu 6 ký tự) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomPass = 'DeepM@' + Math.floor(1000 + Math.random() * 9000);
                        setResetPassword(randomPass);
                      }}
                      className="text-[11px] text-indigo-600 hover:underline font-medium"
                    >
                      Tạo ngẫu nhiên
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showResetPassword ? (
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
                    onClick={() => setResetStaff(null)}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
                  >
                    {actionLoading ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: XÁC NHẬN XÓA NHÂN VIÊN */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Xác nhận xóa tài khoản
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hành động này không thể hoàn tác
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 mb-4 text-xs text-rose-800 space-y-1">
                <p>
                  Bạn đang chuẩn bị xóa tài khoản của:{' '}
                  <span className="font-bold text-rose-950">
                    {deleteTarget.full_name || deleteTarget.email}
                  </span>
                </p>
                <p className="font-mono text-[11px] text-rose-600">{deleteTarget.email}</p>
                <p className="text-[11px] text-rose-700 pt-1">
                  💡 Các bài đăng trong quá khứ của nhân viên này sẽ được giữ lại an toàn trong hệ thống để bảo lưu số liệu thống kê.
                </p>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmDelete}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition"
                >
                  {actionLoading ? 'Đang xóa...' : 'Đồng ý xóa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
