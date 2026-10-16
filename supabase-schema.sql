-- =========================================================================
-- SCHEMA CƠ SỞ DỮ LIỆU DEEPM MARKETING (PROFILES & POSTS)
-- =========================================================================

-- 1. BẢNG PROFILES (Thông tin người dùng & phân quyền)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text default 'staff' check (role in ('staff', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bật Row Level Security (RLS) cho profiles
alter table public.profiles enable row level security;

-- Xóa các policy cũ để tránh trùng lặp hoặc đệ quy
drop policy if exists "Mọi người có thể đọc profile của mình hoặc admin đọc tất cả" on public.profiles;
drop policy if exists "Người dùng có thể tự cập nhật profile của mình" on public.profiles;
drop policy if exists "Cho phép đọc profiles" on public.profiles;
drop policy if exists "Cho phép sửa profiles" on public.profiles;

-- Function kiểm tra quyền admin an toàn (Security Definer - không trigger đệ quy RLS)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Policy Profiles: Nhân viên chỉ đọc profile của mình, Admin đọc được tất cả
drop policy if exists "Cho phép đọc profiles" on public.profiles;
drop policy if exists "Xem profiles an toàn" on public.profiles;
create policy "Xem profiles an toàn"
  on public.profiles for select
  to authenticated
  using (
    auth.uid() = id or public.is_admin()
  );

-- Người dùng tự cập nhật profile của chính mình
create policy "Cho phép sửa profiles"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Trigger tự động tạo profile khi người dùng được tạo qua Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'staff' -- Mặc định tất cả người dùng tạo mới đều là staff
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. BẢNG POSTS (Thông tin bài đăng Marketing)
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null default auth.uid(),
  
  -- Các trường BẮT BUỘC người dùng điền
  platform text not null,       -- Facebook, TikTok, Instagram, LinkedIn, Youtube, v.v.
  posted_at timestamp with time zone not null, -- Ngày giờ đăng bài
  post_url text not null,       -- Link bài đăng
  content_type text not null,   -- Hình ảnh, Video, Bài viết, Story, Reels, Shorts,...
  
  -- Các trường TÙY CHỌN (Không bắt buộc hoặc tự điền)
  campaign text,                -- Tên chiến dịch
  notes text,                   -- Ghi chú nội dung
  
  -- Số liệu tương tác (mặc định 0, nhân viên có thể vào cập nhật sau)
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  views integer default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bật Row Level Security cho bảng posts
alter table public.posts enable row level security;

-- Xóa các policy posts cũ
drop policy if exists "Xem bài đăng" on public.posts;
drop policy if exists "Thêm bài đăng" on public.posts;
drop policy if exists "Sửa bài đăng" on public.posts;
drop policy if exists "Xóa bài đăng" on public.posts;

-- 1. Xem: Nhân viên xem bài của mình, Admin xem được tất cả bài
create policy "Xem bài đăng"
  on public.posts for select
  to authenticated
  using (
    auth.uid() = user_id or public.is_admin()
  );

-- 2. Tạo: Người dùng đã đăng nhập có thể thêm bài đăng (gắn với user_id của họ)
create policy "Thêm bài đăng"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 3. Sửa: Người đăng hoặc Admin có quyền sửa/cập nhật số liệu
create policy "Sửa bài đăng"
  on public.posts for update
  to authenticated
  using (
    auth.uid() = user_id or public.is_admin()
  );

-- 4. Xóa: Người đăng hoặc Admin có quyền xóa
create policy "Xóa bài đăng"
  on public.posts for delete
  to authenticated
  using (
    auth.uid() = user_id or public.is_admin()
  );
