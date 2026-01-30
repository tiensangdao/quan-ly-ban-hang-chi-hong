import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined') {
    console.error('❌ LỖI CRITICAL: Thiếu biến môi trường Supabase!');
    console.error('👉 Vui lòng tạo file .env.local và điền NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

// Fallback để không crash build time, nhưng sẽ báo lỗi nếu gọi API thực
export const supabase = createClient(
  supabaseUrl || 'https://site-chua-cau-hinh.supabase.co',
  supabaseAnonKey || 'missing-key'
)