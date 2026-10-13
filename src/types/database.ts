export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'staff' | 'admin';
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  platform: string;
  posted_at: string;
  post_url: string;
  content_type: string;
  campaign?: string | null;
  notes?: string | null;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
}

export const PLATFORMS = [
  'Facebook',
  'TikTok',
  'Instagram',
  'LinkedIn',
  'YouTube',
  'Website / Blog',
  'Khác',
] as const;

export const CONTENT_TYPES = [
  'Bài viết & Hình ảnh (Post)',
  'Video ngắn (Reels / TikTok / Shorts)',
  'Video dài (YouTube / Video FB)',
  'Story',
  'Bài viết chia sẻ kiến thức (Blog)',
  'Livestream',
  'Khác',
] as const;
