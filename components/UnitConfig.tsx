"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Signal, Battery, RadioTower } from "lucide-react";

type Unit = Database["public"]["Tables"]["units"]["Row"];

export function UnitConfig() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUnits = async () => {
            const { data } = await supabase.from("units").select("*").order("id");
            if (data) setUnits(data);
            setLoading(false);
        };

        fetchUnits();

        const channel = supabase
            .channel("public:units")
            .on("postgres_changes", { event: "*", schema: "public", table: "units" }, () => {
                fetchUnits();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const updateThreshold = async (id: string, newThreshold: number) => {
        // Optimistic UI update
        setUnits(current => current.map(u => u.id === id ? { ...u, threshold: newThreshold } : u));

        // Update DB
        await supabase.from("units").update({ threshold: newThreshold }).eq("id", id);
    };

    if (loading) {
        return <div className="text-zinc-500 p-4">ユニット情報を読み込み中...</div>;
    }

    return (
        <>
            {units.map((unit) => (
                <Card key={unit.id} className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg flex items-center">
                                    <RadioTower className="w-5 h-5 mr-2 text-zinc-400" />
                                    {unit.id}
                                </CardTitle>
                                <CardDescription className="text-zinc-500 mt-1">
                                    最終通信: {unit.last_seen ? new Date(unit.last_seen).toLocaleString() : "不明"}
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className={unit.status === 'online' ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" : "text-zinc-500 border-zinc-700 bg-zinc-900"}>
                                {unit.status.toUpperCase()}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-4 mb-2">
                            <div className="flex items-center text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md">
                                <Battery className={`w-4 h-4 mr-2 ${unit.battery < 20 ? 'text-red-400' : 'text-emerald-400'}`} />
                                バッテリー: {unit.battery}%
                            </div>
                            <div className="flex items-center text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md">
                                <Signal className="w-4 h-4 mr-2 text-blue-400" />
                                シグナル: {unit.signal_strength}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-zinc-300">
                                    AI検知 閾値 (Threshold)
                                </label>
                                <span className="text-sm font-mono text-destructive">
                                    {unit.threshold.toFixed(2)}
                                </span>
                            </div>
                            <Slider
                                value={[unit.threshold]}
                                onValueChange={(vals) => updateThreshold(unit.id, vals[0])}
                                max={1.0}
                                step={0.01}
                                className="py-2 cursor-pointer"
                            />
                            <p className="text-xs text-zinc-500">
                                閾値を下げるとより小さな音でも検知しますが、誤検知（ノイズ）が増加する可能性があります。
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </>
    );
}
