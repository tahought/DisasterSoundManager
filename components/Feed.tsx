"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayCircle, AlertTriangle, AlertCircle, Wind, AudioWaveform, HelpCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

type Incident = Database["public"]["Tables"]["incidents"]["Row"];

const TYPE_CONFIG = {
    "SOS": { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertTriangle },
    "崩落音": { color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: AlertCircle },
    "叫び声": { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: AudioWaveform },
    "破砕音": { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: AudioWaveform },
    "環境音": { color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", icon: Wind },
};

const STATUS_LABELS = {
    "pending": "未対応",
    "in_progress": "対応中",
    "resolved": "解決済",
};

export function Feed() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch initial data
    useEffect(() => {
        const fetchIncidents = async () => {
            const { data, error } = await supabase
                .from("incidents")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(50);

            if (!error && data) {
                setIncidents(data);
            }
            setLoading(false);
        };

        fetchIncidents();

        // Subscribe to realtime updates
        const channel = supabase
            .channel("public:incidents")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "incidents" },
                (payload) => {
                    const newIncident = payload.new as Incident;
                    setIncidents((current) => {
                        // Check if it already exists (avoid duplicates in rapid events)
                        if (current.find(i => i.id === newIncident.id)) return current;
                        return [newIncident, ...current].slice(0, 50); // Keep top 50
                    });
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "incidents" },
                (payload) => {
                    const updatedIncident = payload.new as Incident;
                    setIncidents((current) =>
                        current.map(i => i.id === updatedIncident.id ? updatedIncident : i)
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        await supabase.from("incidents").update({ status: newStatus }).eq("id", id);
        // Optimistic update
        setIncidents((current) =>
            current.map(i => i.id === id ? { ...i, status: newStatus } : i)
        );
    };

    const playAudio = (url: string | null) => {
        if (!url) {
            alert("音声ファイルがありません");
            return;
        }
        // In a real app, use an AudioContext or HTMLAudioElement
        const audio = new Audio(url);
        audio.play().catch(e => console.error("Audio playback failed", e));
    };

    return (
        <Card className="h-full bg-zinc-950/50 backdrop-blur-md border border-zinc-800 flex flex-col shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-zinc-800 bg-zinc-900/30 px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center">
                            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse mr-2" />
                            リアルタイム検知フィード
                        </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-zinc-400 bg-zinc-900 border-zinc-700">
                        {incidents.length}件表示中
                    </Badge>
                </div>
            </CardHeader>

            <ScrollArea className="flex-1 max-h-full">
                <div className="p-4 space-y-3">
                    {loading ? (
                        <div className="text-center text-zinc-500 py-10">読み込み中...</div>
                    ) : incidents.length === 0 ? (
                        <div className="text-center text-zinc-500 py-10">検知されたインシデントはありません</div>
                    ) : (
                        incidents.map((incident, index) => {
                            const config = TYPE_CONFIG[incident.type as keyof typeof TYPE_CONFIG] || { color: "bg-zinc-800 text-zinc-300", icon: HelpCircle };
                            const Icon = config.icon;
                            const isRecent = index === 0 && new Date().getTime() - new Date(incident.created_at || "").getTime() < 10000;

                            return (
                                <div
                                    key={incident.id}
                                    className={`relative p-4 rounded-xl border border-zinc-800 bg-zinc-900/80 transition-all ${isRecent ? "animate-in fade-in slide-in-from-top-4 duration-500" : ""}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center space-x-2">
                                            <Badge variant="outline" className={`${config.color} uppercase tracking-wider font-semibold border`}>
                                                <Icon className="w-3 h-3 mr-1" />
                                                {incident.type}
                                            </Badge>
                                            <span className="text-sm text-zinc-500 font-medium">
                                                {(incident.confidence * 100).toFixed(1)}% 確信度
                                            </span>
                                        </div>
                                        <span className="text-xs text-zinc-500">
                                            {incident.created_at ? formatDistanceToNow(new Date(incident.created_at), { addSuffix: true, locale: ja }) : ""}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-zinc-300">
                                                ユニット: <span className="text-zinc-100">{incident.unit_id}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Select
                                                value={incident.status}
                                                onValueChange={(val) => updateStatus(incident.id, val)}
                                            >
                                                <SelectTrigger className="h-8 w-[110px] text-xs bg-zinc-950 border-zinc-700 text-zinc-300 focus:ring-1 focus:ring-destructive">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-300">
                                                    <SelectItem value="pending">未対応</SelectItem>
                                                    <SelectItem value="in_progress">対応中</SelectItem>
                                                    <SelectItem value="resolved">解決済</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className={`h-8 w-8 p-0 rounded-full ${incident.audio_url ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30' : 'text-zinc-600 cursor-not-allowed'}`}
                                                onClick={() => playAudio(incident.audio_url)}
                                                title={incident.audio_url ? "音声を再生" : "音声データなし"}
                                            >
                                                <PlayCircle className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
}
