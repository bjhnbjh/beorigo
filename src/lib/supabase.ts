import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const key = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * 환경변수(VITE_SUPABASE_*)가 없으면 null → 더미(인메모리) 모드로 동작.
 * Supabase 프로젝트를 만들고 .env.local을 채우면 자동으로 실제 DB에 연결됩니다.
 */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;
