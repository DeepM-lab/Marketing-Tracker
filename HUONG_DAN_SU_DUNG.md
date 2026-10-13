# 🚀 Hướng Dẫn Cài Đặt & Sử Dụng Marketing Tracker

Dự án theo dõi tiến độ bài đăng Marketing cho nhân viên và ban quản lý (sếp).

---

## 📌 Các tính năng chính đã hoàn thành:
1. **Form báo cáo bài đăng (`/`)**:
   - Các trường **BẮT BUỘC**: `Kênh đăng (platform)`, `Ngày & giờ đăng (posted_at)`, `Link bài đăng (post_url)`, `Loại nội dung (content_type)`.
   - Các trường **TÙY CHỌN / TỰ ĐỘNG**: `Chiến dịch (campaign)`, `Ghi chú nội dung (notes)`, số liệu tương tác ban đầu (`likes`, `comments`, `shares`, `views`).
   - Tự động điền ngày giờ hiện tại cho nhân viên.
2. **Quản lý bài của tôi (`/my-posts`)**:
   - Nhân viên xem lại toàn bộ bài do chính mình đã đăng.
   - Cập nhật số liệu tương tác (likes/comments/shares/views) sau khi bài đăng đã chạy được vài ngày.
3. **Dashboard Quản lý của Sếp (`/admin`)**:
   - Chỉ dành cho sếp / admin (`vuonghongky26@gmail.com`).
   - Xem toàn bộ bài đăng của mọi nhân viên trong công ty.
   - Thống kê tổng hợp: Tổng bài, tổng likes, bình luận, shares, views.
   - Bộ lọc linh hoạt: Lọc theo từng nhân viên, theo kênh (Facebook, TikTok...), theo khoảng ngày, tìm kiếm theo từ khóa.
   - **Xuất báo cáo Excel (`.xlsx`)** chỉ với 1 click chuột.
4. **Endpoint chống ngủ ngày Tết (`/api/ping`)**:
   - Dùng để cài đặt cron-job ping tự động định kỳ, giữ database Supabase luôn thức qua các kỳ nghỉ dài.

---

## 🛠️ Hướng dẫn kết nối Supabase (Chỉ mất 2 phút)

### Bước 1: Tạo dự án trên Supabase
1. Truy cập [https://supabase.com](https://supabase.com) và tạo 1 Project mới (chọn Region `Singapore`).
2. Vào mục **SQL Editor** trong menu bên trái.
3. Mở file [supabase-schema.sql](file:///d:/Workspace/form/supabase-schema.sql) trong thư mục dự án, copy toàn bộ nội dung và paste vào SQL Editor của Supabase rồi bấm **Run**.
   *(File SQL này sẽ tự động tạo bảng profiles, posts, cài đặt bảo mật RLS và thiết lập quyền Admin cho email `vuonghongky26@gmail.com`)*.

### Bước 2: Lấy API Key
1. Vào mục **Project Settings** -> **API** trên Supabase.
2. Copy `Project URL` và `anon public key`.
3. Mở file `.env.local` tại `D:\Workspace\form\.env.local` và điền vào:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

### Bước 3: Chạy ứng dụng
Mở terminal tại `d:\Workspace\form` và gõ:
```bash
pnpm dev
```
Truy cập: [http://localhost:3000](http://localhost:3000)

---

## 👤 Tài khoản mẫu
- **Tài khoản Admin / Sếp**: `vuonghongky26@gmail.com` (mật khẩu tự tạo lúc đăng ký trên màn hình `/login`).
- **Tài khoản Nhân viên**: Đăng ký bất kỳ email nào khác, hệ thống sẽ tự động gán role `staff`.
