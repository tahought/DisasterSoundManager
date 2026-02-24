import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    // 1. 環境変数を関数内で取得（安全策）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 2. 環境変数が設定されていない場合、処理を中断してログを出す（クラッシュ防止）
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Middleware Error: Supabase URL or Anon Key is missing. Check Vercel Env Vars.");
        return res; // 認証チェックをスルーしてページを表示させる（またはエラーページへ）
    }

    try {
        // Supabaseクライアントの初期化（fetchのバインドをシンプルに修正）
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false,
            },
        });

        // クッキーの確認
        // 注: Supabase Authは通常 'sb-' で始まる複数のクッキーを使用します
        const hasSession = req.cookies.getAll().some(cookie => cookie.name.includes('supabase-auth-token') || cookie.name.includes('sb-'));

        // /dashboard へのアクセス保護
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
            if (!hasSession) {
                return NextResponse.redirect(new URL('/login', req.url));
            }
        }

        // ログイン済みなら /login から /dashboard へリダイレクト
        if (req.nextUrl.pathname === '/login') {
            if (hasSession) {
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }
        }
    } catch (error) {
        console.error("Middleware Exception:", error);
    }

    return res;
}

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
};