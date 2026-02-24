import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // ビルド時にエラーを止めるのではなく、実行時に警告を出す構成にする場合
    console.warn('Supabase environment variables are missing');
}

export const supabase = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co', // ダミーURL
    supabaseAnonKey || 'placeholder-key'
);