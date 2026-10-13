'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/types/database';
import {
  ExternalLink,
  Edit2,
  Trash2,
  Save,
  X,
  Calendar,
  Layers,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  AlertCircle,
} from 'lucide-react';

export default function MyPostsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Form edit states
  const [editLikes, setEditLikes] = useState<number>(0);
  const [editComments, setEditComments] = useState<number>(0);
  const [editShares, setEditShares] = useState<number>(0);
  const [editViews, setEditViews] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchMyPosts = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('posted_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách bài:', err);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    fetchMyPosts();
  }, [fetchMyPosts]);

  const startEdit = (post: Post) => {
    setEditingPostId(post.id);
    setEditLikes(post.likes || 0);
    setEditComments(post.comments || 0);
    setEditShares(post.shares || 0);
    setEditViews(post.views || 0);
    setEditNotes(post.notes || '');
  };

  const cancelEdit = () => {
    setEditingPostId(null);
  };

  const handleUpdate = async (postId: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          likes: editLikes,
          comments: editComments,
          shares: editShares,
          views: editViews,
          notes: editNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;

      setEditingPostId(null);
      await fetchMyPosts();
    } catch (err: unknown) {
      const error = err as Error;
      alert('Lỗi cập nhật: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài báo cáo này?')) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: unknown) {
      const error = err as Error;
      alert('Lỗi xóa bài: ' + error.message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bài đăng của tôi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Xem lại lịch sử và cập nhật số liệu tương tác (likes, comments, views...) cho các bài đã đăng.
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition w-fit"
        >
          + Thêm bài mới
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-700">Bạn chưa có bài đăng nào được ghi nhận.</p>
          <p className="mt-1 text-xs text-slate-400">Hãy nhấn nút bên dưới để gửi báo cáo bài đăng đầu tiên.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition"
          >
            Điền form báo cáo ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isEditing = editingPostId === post.id;
            return (
              <div
                key={post.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                      {post.platform}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      {post.content_type}
                    </span>
                    {post.campaign && (
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        🎯 {post.campaign}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(post.posted_at).toLocaleString('vi-VN')}</span>
                  </div>
                </div>

                <div className="py-3">
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline break-all"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    {post.post_url}
                  </a>

                  {post.notes && !isEditing && (
                    <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      📝 {post.notes}
                    </p>
                  )}
                </div>

                {/* SỐ LIỆU TƯƠNG TÁC */}
                {isEditing ? (
                  <div className="mt-3 rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                    <p className="text-xs font-semibold text-slate-700">Cập nhật số liệu tương tác mới:</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Likes</label>
                        <input
                          type="number"
                          min="0"
                          value={editLikes}
                          onChange={(e) => setEditLikes(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Bình luận</label>
                        <input
                          type="number"
                          min="0"
                          value={editComments}
                          onChange={(e) => setEditComments(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Chia sẻ</label>
                        <input
                          type="number"
                          min="0"
                          value={editShares}
                          onChange={(e) => setEditShares(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Lượt xem (Views)</label>
                        <input
                          type="number"
                          min="0"
                          value={editViews}
                          onChange={(e) => setEditViews(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-center font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Ghi chú bổ sung</label>
                      <textarea
                        rows={3}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Cập nhật thêm ghi chú nếu cần..."
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-900 leading-relaxed outline-none focus:border-slate-900 resize-y min-h-[80px]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                      >
                        <X className="h-3.5 w-3.5" /> Hủy
                      </button>
                      <button
                        disabled={updating}
                        onClick={() => handleUpdate(post.id)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <Save className="h-3.5 w-3.5" /> {updating ? 'Đang lưu...' : 'Lưu cập nhật'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1 text-rose-600">
                        <Heart className="h-3.5 w-3.5" /> {(post.likes || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-blue-600">
                        <MessageCircle className="h-3.5 w-3.5" /> {(post.comments || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Share2 className="h-3.5 w-3.5" /> {(post.shares || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-purple-600">
                        <Eye className="h-3.5 w-3.5" /> {(post.views || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(post)}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                        Cập nhật số liệu
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="rounded-lg border border-rose-100 p-1 text-rose-500 hover:bg-rose-50 transition"
                        title="Xóa bài đăng"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
