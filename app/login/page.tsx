"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            // Manually set a simple cookie for the middleware to pick up since we aren't using @supabase/ssr
            if (data.session) {
                document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${data.session.expires_in}; SameSite=Lax`;
                document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
            }

            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "ログインに失敗しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-destructive/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-md z-10 border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-1 text-center pb-6">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-destructive/20 rounded-2xl">
                            <ShieldAlert className="w-10 h-10 text-destructive" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-zinc-100">
                        DCON 2025
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        次世代災害音声監視システム 管理画面
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-destructive"
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                id="password"
                                type="password"
                                placeholder="パスワード"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-destructive"
                            />
                        </div>
                        {error && (
                            <div className="text-sm font-medium text-destructive mt-2 text-center">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full bg-destructive hover:bg-destructive/90 text-white font-medium transition-all"
                            disabled={loading}
                        >
                            {loading ? "認証中..." : "ログイン"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
