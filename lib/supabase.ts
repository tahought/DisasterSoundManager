// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// lib/supabase.ts の中
console.log("Check URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Check KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + "...");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// URLが未設定だと Fetch エラーになります
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabaseの環境変数が設定されていません。");
}

export const supabase = createClient<Database>(
    supabaseUrl || '',
    supabaseAnonKey || ''
);