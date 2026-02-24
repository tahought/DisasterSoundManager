import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a simple supabase client for the middleware (edge compatible)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
        },
        global: {
            fetch: req.nextUrl ? fetch.bind(globalThis) : fetch,
        },
    });

    // Get session from cookie or header (in a real app, use @supabase/ssr for robust cookie handling)
    // For the sake of this dashboard, we'll just check if there's any session cookie
    // Note: To make it production ready and secure, @supabase/ssr is recommended. We're keeping it simple here.
    const authCookie = req.cookies.get('sb-access-token') || req.cookies.get('sb-refresh-token') || req.cookies.get('supabase-auth-token');

    // Protect /dashboard
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
        if (!authCookie) {
            return NextResponse.redirect(new URL('/login', req.url));
        }
    }

    // Redirect /login to /dashboard if already logged in
    if (req.nextUrl.pathname === '/login') {
        if (authCookie) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    }

    return res;
}

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
};
