"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#71717a'];

export function Chart() {
    const [data, setData] = useState<{ name: string, value: number }[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            // In a real application, you'd use a SQL function or view to aggregate this.
            // For this demo, we'll fetch recent incidents and aggregate client-side
            const { data: incidents } = await supabase
                .from("incidents")
                .select("type")
                .limit(1000);

            if (incidents) {
                const counts: Record<string, number> = {};
                incidents.forEach(inc => {
                    counts[inc.type] = (counts[inc.type] || 0) + 1;
                });

                const chartData = [
                    { name: "SOS", value: counts["SOS"] || 0 },
                    { name: "崩落音", value: counts["崩落音"] || 0 },
                    { name: "叫び声", value: counts["叫び声"] || 0 },
                    { name: "破砕音", value: counts["破砕音"] || 0 },
                    { name: "環境音", value: counts["環境音"] || 0 },
                ].filter(i => i.value > 0);

                setData(chartData);
            }
        };

        fetchStats();

        const channel = supabase
            .channel("public:incidents")
            .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => {
                fetchStats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <Card className="h-full bg-zinc-950/50 backdrop-blur-md border border-zinc-800">
            <CardHeader className="border-b border-zinc-800 px-6 py-4">
                <CardTitle className="text-lg font-bold">音声種別 検出統計</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-73px)] p-4 flex items-center justify-center">
                {data.length === 0 ? (
                    <div className="text-zinc-500">データがありません</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                                itemStyle={{ color: '#f4f4f5' }}
                            />
                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#a1a1aa' }} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
