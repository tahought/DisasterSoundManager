"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Feed } from "@/components/Feed";
import { Chart } from "@/components/Chart";
import { DemoPanel } from "@/components/DemoPanel";
import { UnitConfig } from "@/components/UnitConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Map as MapIcon, Settings } from "lucide-react";

// Dynamically import Map with SSR disabled since Leaflet relies on window
const Map = dynamic(() => import("@/components/Map"), {
    ssr: false,
    loading: () => <div className="w-full h-[400px] bg-zinc-900/50 animate-pulse rounded-xl border border-zinc-800 flex items-center justify-center text-zinc-500">地図を読み込み中...</div>
});

export default function DashboardPage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return null; // Avoid hydration mismatch on initial render

    return (
        <div className="h-full flex flex-col space-y-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">災害音声監視ダッシュボード</h1>
                    <p className="text-zinc-400">リアルタイムの音声検知とデバイス状態を監視します。</p>
                </div>
                <div>
                    <DemoPanel />
                </div>
            </div>

            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                        <Activity className="w-4 h-4 mr-2" />
                        オーバービュー
                    </TabsTrigger>
                    <TabsTrigger value="map" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                        <MapIcon className="w-4 h-4 mr-2" />
                        広域マップ
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                        <Settings className="w-4 h-4 mr-2" />
                        ユニット設定
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 mt-4">
                    <TabsContent value="overview" className="h-full m-0 space-y-6 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Feed */}
                            <div className="lg:col-span-1 h-[600px] xl:h-[700px]">
                                <Feed />
                            </div>

                            {/* Right Column: Chart & Mini Map */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="h-[300px] xl:h-[350px]">
                                    <Chart />
                                </div>
                                <div className="h-[276px] xl:h-[326px] bg-zinc-900/50 rounded-xl border border-zinc-800 p-2 relative overflow-hidden">
                                    <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-zinc-800 text-sm font-medium">
                                        最新インシデント位置
                                    </div>
                                    <Map />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="map" className="h-[700px] m-0 outline-none">
                        <div className="h-full w-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-2">
                            <Map />
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="m-0 outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <UnitConfig />
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
