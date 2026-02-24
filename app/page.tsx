import { redirect } from 'next/navigation';

export default function Home() {
    // Redirect root directly to dashboard (which will be protected by middleware)
    redirect('/dashboard');
}

export const dynamic = 'force-dynamic';