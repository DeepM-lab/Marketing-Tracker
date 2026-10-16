import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { translateSupabaseError } from '@/lib/utils/errorMessages';

// Helper kiểm tra quyền Admin
async function verifyAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return { error: 'Vui lòng đăng nhập để thực hiện chức năng này.', status: 401 };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single();

  if (profile?.role !== 'admin') {
    return {
      error: 'Từ chối truy cập: Chỉ Quản trị viên (Admin) mới có quyền quản lý nhân viên.',
      status: 403,
    };
  }

  return { currentUser, supabase };
}

// 1. GET: Lấy danh sách nhân viên kèm số lượng bài đăng
export async function GET() {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { supabase } = authResult;

    // Lấy profiles và đếm bài posts tương ứng
    const [profilesRes, postsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('posts').select('user_id'),
    ]);

    if (profilesRes.error) throw profilesRes.error;

    // Đếm số bài đăng cho mỗi nhân viên
    const postCounts: Record<string, number> = {};
    if (postsRes.data) {
      postsRes.data.forEach((p) => {
        if (p.user_id) {
          postCounts[p.user_id] = (postCounts[p.user_id] || 0) + 1;
        }
      });
    }

    const staffWithMetrics = profilesRes.data.map((profile) => ({
      ...profile,
      posts_count: postCounts[profile.id] || 0,
    }));

    return NextResponse.json({ staff: staffWithMetrics });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Lỗi nạp danh sách nhân viên' },
      { status: 500 }
    );
  }
}

// 2. POST: Tạo nhân viên mới
export async function POST(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { supabase } = authResult;
    const body = await request.json();
    const { email, password, fullName, role = 'staff' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ Email và Mật khẩu khởi tạo.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu khởi tạo phải có ít nhất 6 ký tự.' },
        { status: 400 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    if (serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: newUserData, error: createError } =
        await adminClient.auth.admin.createUser({
          email: email.trim(),
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName?.trim() || email.split('@')[0],
          },
        });

      if (createError) {
        return NextResponse.json(
          { error: translateSupabaseError(createError.message) || createError.message },
          { status: 400 }
        );
      }

      if (newUserData.user) {
        await adminClient
          .from('profiles')
          .update({
            role: role === 'admin' ? 'admin' : 'staff',
            full_name: fullName?.trim() || email.split('@')[0],
          })
          .eq('id', newUserData.user.id);
      }

      return NextResponse.json({
        success: true,
        message: 'Tạo tài khoản nhân viên thành công! Nhân viên có thể đăng nhập ngay.',
        user: newUserData.user,
      });
    } else {
      const anonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

      const isolatedClient = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: newUserData, error: signupError } =
        await isolatedClient.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName?.trim() || email.split('@')[0],
            },
          },
        });

      if (signupError) {
        return NextResponse.json(
          { error: translateSupabaseError(signupError.message) || signupError.message },
          { status: 400 }
        );
      }

      if (role === 'admin' && newUserData.user) {
        await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', newUserData.user.id);
      }

      return NextResponse.json({
        success: true,
        message:
          'Tạo tài khoản thành công! (Gợi ý: Thêm SUPABASE_SERVICE_ROLE_KEY vào .env.local để tự động xác thực email).',
        user: newUserData.user,
      });
    }
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra phía máy chủ.' },
      { status: 500 }
    );
  }
}

// 3. PATCH: Cập nhật vai trò hoặc đổi mật khẩu cho nhân viên
export async function PATCH(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { currentUser, supabase } = authResult;
    const body = await request.json();
    const { userId, role, newPassword, fullName } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Thiếu ID nhân viên cần cập nhật.' }, { status: 400 });
    }

    // Không được tự hạ quyền của chính mình nếu là admin
    if (userId === currentUser.id && role && role !== 'admin') {
      return NextResponse.json(
        { error: 'Bạn không thể tự hạ quyền Admin của chính mình.' },
        { status: 400 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    // 1. Cập nhật role hoặc fullName trong bảng profiles
    const updatePayload: Record<string, string> = {};
    if (role && (role === 'admin' || role === 'staff')) updatePayload.role = role;
    if (fullName) updatePayload.full_name = fullName;

    if (Object.keys(updatePayload).length > 0) {
      if (serviceRoleKey) {
        // Bỏ qua RLS hoàn toàn nếu có service_role key
        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { error: profileError } = await adminClient
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId);

        if (profileError) throw profileError;
      } else {
        // Cập nhật thông qua client của Admin hiện tại
        const { data: updatedRows, error: profileError } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId)
          .select();

        if (profileError) throw profileError;

        // Nếu 0 dòng bị ảnh hưởng do RLS chặn, thử fallback gọi RPC Function
        if (!updatedRows || updatedRows.length === 0) {
          if (updatePayload.role) {
            const { error: rpcError } = await supabase.rpc('admin_set_user_role', {
              target_user_id: userId,
              new_role: updatePayload.role,
            });

            if (rpcError) {
              throw new Error(
                'Chính sách bảo mật (RLS) của Supabase đang chặn Admin sửa quyền của nhân viên khác. ' +
                  'Vui lòng chạy lệnh SQL cập nhật Policy trên Supabase (xem hướng dẫn) hoặc thêm SUPABASE_SERVICE_ROLE_KEY vào .env.local.'
              );
            }
          }
        }
      }
    }

    // 2. Nếu có yêu cầu đặt lại mật khẩu mới cho nhân viên
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' },
          { status: 400 }
        );
      }

      if (serviceRoleKey) {
        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { error: resetPassError } = await adminClient.auth.admin.updateUserById(userId, {
          password: newPassword,
        });

        if (resetPassError) throw resetPassError;
      } else {
        return NextResponse.json(
          {
            error:
              'Cần cấu hình SUPABASE_SERVICE_ROLE_KEY trong .env.local để Admin có thể đổi mật khẩu trực tiếp cho nhân viên.',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin nhân viên thành công!',
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Lỗi cập nhật nhân viên.' },
      { status: 500 }
    );
  }
}

// 4. DELETE: Xóa tài khoản nhân viên (khi nghỉ việc)
export async function DELETE(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { currentUser, supabase } = authResult;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin ID nhân viên cần xóa.' },
        { status: 400 }
      );
    }

    // Chặn nghiêm ngặt: Admin không được tự xóa chính mình!
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Bảo mật: Bạn không thể tự xóa tài khoản của chính mình!' },
        { status: 400 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    if (serviceRoleKey) {
      // Dùng Admin API để xóa hoàn toàn khỏi auth.users (cascade xóa profile)
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteAuthError) throw deleteAuthError;
    } else {
      // Xóa khỏi bảng profiles (để hủy quyền truy cập và dữ liệu profile)
      const { data: deletedRows, error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .select();

      if (deleteProfileError) throw deleteProfileError;

      if (!deletedRows || deletedRows.length === 0) {
        const { error: rpcError } = await supabase.rpc('admin_delete_staff_profile', {
          target_user_id: userId,
        });

        if (rpcError) {
          throw new Error(
            'Chính sách bảo mật (RLS) của Supabase đang chặn xóa nhân viên. ' +
              'Vui lòng chạy lệnh SQL cập nhật Policy trên Supabase hoặc cấu hình SUPABASE_SERVICE_ROLE_KEY trong .env.local.'
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa tài khoản nhân viên thành công!',
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Lỗi khi xóa nhân viên.' },
      { status: 500 }
    );
  }
}
