"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    LayoutDashboard,
    Map as MapIcon,
    Activity,
    Settings,
    LogOut,
    RadioTower,
    Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
    { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
    // { href: "/dashboard/map", label: "マップビュー", icon: MapIcon }, // For future expansion
    // { href: "/dashboard/analytics", label: "分析", icon: Activity }, // For future expansion
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Clear cookies
        document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/login");
    };

    const NavLinks = () => (
        <div className="flex flex-col space-y-2 w-full">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                    <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
                        <div
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? "bg-destructive/10 text-destructive font-medium border border-destructive/20"
                                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
                <div className="h-16 flex items-center px-6 border-b border-zinc-800">
                    <RadioTower className="w-6 h-6 text-destructive mr-3" />
                    <span className="font-bold text-lg tracking-tight">DCON 2025</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 content-start">
                    <NavLinks />
                </div>

                <div className="p-4 border-t border-zinc-800">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        ログアウト
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden h-16 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md z-10">
                    <div className="flex items-center">
                        <RadioTower className="w-5 h-5 text-destructive mr-2" />
                        <span className="font-bold">DCON 2025</span>
                    </div>
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-zinc-400">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 bg-zinc-950 border-zinc-800 p-0 flex flex-col">
                            <div className="h-16 flex items-center px-6 border-b border-zinc-800">
                                <span className="font-bold text-lg">Menu</span>
                            </div>
                            <div className="flex-1 p-4">
                                <NavLinks />
                            </div>
                            <div className="p-4 border-t border-zinc-800">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-zinc-400"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="w-5 h-5 mr-3" />
                                    ログアウト
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-black/20">
                    {children}
                </main>
            </div>
        </div>
    );
}
