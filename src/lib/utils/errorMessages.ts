/**
 * Chuyển đổi thông báo lỗi của Supabase sang tiếng Việt
 */
export function translateSupabaseError(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.',
    'Email not confirmed': 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.',
    'User already registered': 'Email này đã được đăng ký. Vui lòng đăng nhập.',
    'Email rate limit exceeded': 'Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.',
    'Password should be at least 6 characters': 'Mật khẩu phải có ít nhất 6 ký tự.',
    'signup_disabled': 'Chức năng đăng ký đang bị tắt. Vui lòng liên hệ quản trị viên.',
    'over_email_send_rate_limit': 'Gửi quá nhiều email. Vui lòng thử lại sau vài phút.',
    'For security purposes, you can only request this once every 60 seconds':
      'Vì lý do bảo mật, bạn chỉ có thể gửi yêu cầu mỗi 60 giây.',
    'Unable to validate email address: invalid format':
      'Định dạng email không hợp lệ. Vui lòng kiểm tra lại.',
  };

  // Tìm trong map
  if (map[message]) return map[message];

  // Tìm khớp một phần (partial match)
  for (const [key, val] of Object.entries(map)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return val;
  }

  return message;
}
