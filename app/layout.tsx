import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Next Gen Disaster Audio Monitoring',
    description: 'DCON 2025 Dashboard for audio incident monitoring',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        // Default to dark mode for a professional dark dashboard look
        <html lang="ja" className="dark">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
